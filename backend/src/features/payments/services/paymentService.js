import { BaseService } from '../../../services/baseService.js';
import { PaymentRepository } from '../repositories/paymentRepository.js';
import Appointment from '../../appointments/models/appointmentModel.js';
import { generateEsewaSignature, verifyEsewaSignature } from '../../../utils/esewa.js';
import Stripe from 'stripe';

/** Stripe secret key is configured and looks like a real key (not placeholder) */
function isStripeConfigured() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || typeof key !== 'string') return false;
  if (!key.startsWith('sk_test_') && !key.startsWith('sk_live_')) return false;
  // Real Stripe keys are ~107 chars; placeholder was much longer
  if (key.length > 120) return false;
  return true;
}

/**
 * Payment Service
 * Contains business logic for payment operations
 */
export class PaymentService extends BaseService {
  constructor() {
    super(new PaymentRepository());
  }

  /**
   * Get payment history
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  async getPaymentHistory(filters = {}, pagination = {}) {
    const { userId, role, status } = filters;

    let query = {};

    if (role === 'patient') {
      query.patientId = userId;
    } else if (role === 'doctor') {
      query.doctorId = userId;
    }

    if (status) {
      query.status = status;
    }

    const options = {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      sort: pagination.sort || '-createdAt',
      populate: [
        { path: 'patientId', select: 'name email' },
        { path: 'doctorId', select: 'name email' },
        { path: 'appointmentId' }
      ]
    };

    return this.repository.findAll(query, options);
  }

  /**
   * Get payment by ID
   * @param {String} id - Payment ID
   * @returns {Promise<Object>}
   */
  async getPaymentById(id) {
    return this.getById(id, {
      populate: [
        { path: 'patientId', select: 'name email phone' },
        { path: 'doctorId', select: 'name email' },
        { path: 'appointmentId' }
      ]
    });
  }

  /**
   * Create payment intent (Stripe)
   * @param {String} appointmentId - Appointment ID
   * @param {Number} amount - Payment amount
   * @returns {Promise<Object>}
   */
  async createPaymentIntent(appointmentId, amount) {
    if (!isStripeConfigured()) {
      throw new Error(
        'Stripe is not configured. Add STRIPE_SECRET_KEY to backend .env with your test key from https://dashboard.stripe.com/test/apikeys'
      );
    }

    // Get appointment details
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId', 'consultationFee name');

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const payAmount = amount || appointment.doctorId.consultationFee || 0;

    // Create payment record
    const payment = await this.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      amount: payAmount,
      currency: 'USD', // Stripe payment; model enum requires uppercase
      paymentMethod: 'stripe',
      status: 'pending'
    });

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    try {
      // Convert NPR to USD (rough conversion rate: 1 USD = 135 NPR)
      const usdAmount = Math.round((payAmount / 135) * 100); // Stripe expects amount in cents

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: usdAmount,
        currency: 'usd', // Stripe API expects lowercase
        metadata: {
          appointmentId: appointmentId,
          paymentId: payment._id.toString(),
          doctorName: appointment.doctorId.name
        },
        description: `Consultation fee for Dr. ${appointment.doctorId.name}`,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Update payment with Stripe payment intent ID
      await this.repository.updateById(payment._id, {
        paymentIntentId: paymentIntent.id
      });

      return {
        payment,
        clientSecret: paymentIntent.client_secret
      };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      // Delete the payment record if Stripe fails
      await this.repository.deleteById(payment._id);
      throw new Error('Failed to create payment intent with Stripe');
    }
  }

  /**
   * Confirm payment
   * @param {String} paymentIntentId - Payment Intent ID
   * @param {String} paymentMethodId - Payment Method ID
   * @returns {Promise<Object>}
   */
  async confirmPayment(paymentIntentId, paymentMethodId) {
    // Find payment by payment intent ID
    const payment = await this.repository.findByPaymentIntentId(paymentIntentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'completed') {
      return payment;
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    try {
      // Retrieve the payment intent to check its status
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Update payment status and appointment
        const updatedPayment = await this.repository.updateStatus(payment._id, 'completed', {
          transactionId: paymentIntentId,
          receiptUrl: `https://dashboard.stripe.com/test/payments/${paymentIntentId}`
        });

        // Update appointment status to confirmed
        await Appointment.findByIdAndUpdate(payment.appointmentId, { status: 'confirmed' });

        return updatedPayment;
      } else if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'requires_confirmation') {
        // Payment needs more action
        throw new Error('Payment requires additional action');
      } else {
        // Payment failed
        await this.repository.updateStatus(payment._id, 'failed', {
          transactionId: paymentIntentId
        });
        throw new Error('Payment failed');
      }
    } catch (error) {
      console.error('Stripe payment confirmation failed:', error);
      await this.repository.updateStatus(payment._id, 'failed', {
        transactionId: paymentIntentId
      });
      throw new Error('Failed to confirm payment with Stripe');
    }
  }

  /**
   * Handle Stripe webhook
   * @param {Object} event - Stripe webhook event
   * @returns {Promise<Object>}
   */
  async handleStripeWebhook(event) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const payment = await this.repository.findByPaymentIntentId(paymentIntent.id);

        if (payment && payment.status !== 'completed') {
          const updatedPayment = await this.repository.updateStatus(payment._id, 'completed', {
            transactionId: paymentIntent.id,
            receiptUrl: `https://dashboard.stripe.com/test/payments/${paymentIntent.id}`
          });

          // Update appointment status to confirmed
          await Appointment.findByIdAndUpdate(payment.appointmentId, { status: 'confirmed' });

          return updatedPayment;
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        const failedPayment = await this.repository.findByPaymentIntentId(failedPaymentIntent.id);

        if (failedPayment && failedPayment.status === 'pending') {
          await this.repository.updateStatus(failedPayment._id, 'failed', {
            transactionId: failedPaymentIntent.id
          });
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return null;
  }

  /**
   * Initialize eSewa payment
   * @param {String} appointmentId - Appointment ID
   * @param {Number} amount - Amount to pay
   * @returns {Promise<Object>}
   */
  async initializeEsewaPayment(appointmentId, amount) {
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId', 'consultationFee');

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const payAmount = amount || appointment.doctorId.consultationFee || 0;
    const transactionUuid = `${appointmentId}-${Date.now()}`;
    const productCode = process.env.ESEWA_PRODUCT_CODE;
    const secretKey = process.env.ESEWA_SECRET_KEY;

    if (!productCode || !secretKey) {
      throw new Error('eSewa configuration is missing');
    }

    // Create payment record
    const payment = await this.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      amount: payAmount,
      currency: 'NPR',
      paymentMethod: 'esewa',
      status: 'pending',
      transactionId: transactionUuid
    });

    const signature = generateEsewaSignature(
      payAmount.toString(),
      transactionUuid,
      productCode,
      secretKey
    );

    return {
      payment,
      esewaConfig: {
        amount: payAmount,
        tax_amount: 0,
        total_amount: payAmount,
        transaction_uuid: transactionUuid,
        product_code: productCode,
        product_service_charge: 0,
        product_delivery_charge: 0,
        success_url: `${process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`}/api/payments/esewa/success-redirect`,
        failure_url: `${process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`}/api/payments/esewa/failure-redirect`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature: signature,
        esewa_url: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
      }
    };
  }

  /**
   * Handle eSewa callback
   * @param {String} encodedData - Base64 encoded data from eSewa
   * @returns {Promise<Object>}
   */
  async handleEsewaCallback(encodedData) {
    const secretKey = process.env.ESEWA_SECRET_KEY;
    const decodedData = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf-8'));

    // Try signature verification first
    let signatureValid = secretKey && verifyEsewaSignature(encodedData, secretKey);
    let verifiedViaStatusApi = false;

    // Fallback: if signature fails, verify via eSewa Transaction Status API
    if (!signatureValid && decodedData.transaction_uuid && decodedData.product_code) {
      const statusResult = await this.verifyEsewaTransactionStatus(
        decodedData.transaction_uuid,
        decodedData.total_amount,
        decodedData.product_code
      );
      if (statusResult?.status === 'COMPLETE') {
        signatureValid = true;
        verifiedViaStatusApi = true;
      }
    }

    if (!signatureValid) {
      throw new Error('Invalid eSewa signature');
    }

    const payment = await this.repository.findOne({ transactionId: decodedData.transaction_uuid });
    if (!payment) {
      throw new Error('Payment not found');
    }

    const isComplete = verifiedViaStatusApi || decodedData.status === 'COMPLETE';
    if (isComplete) {
      const updatedPayment = await this.repository.updateStatus(payment._id, 'completed', {
        transactionId: decodedData.transaction_uuid,
        esewaTransactionId: decodedData.transaction_code,
        receiptUrl: `https://rc-epay.esewa.com.np/api/epay/main/v2/form?status=COMPLETE&data=${encodedData}`
      });

      await Appointment.findByIdAndUpdate(payment.appointmentId, { status: 'confirmed' });

      return updatedPayment;
    } else {
      return this.repository.updateStatus(payment._id, 'failed', {
        transactionId: decodedData.transaction_uuid
      });
    }
  }

  /**
   * Verify transaction via eSewa Status API (fallback when redirect signature verification fails)
   */
  async verifyEsewaTransactionStatus(transactionUuid, totalAmount, productCode) {
    try {
      const amount = Number(totalAmount.toString().replace(/,/g, ''));
      const url = `https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${encodeURIComponent(productCode)}&total_amount=${amount}&transaction_uuid=${encodeURIComponent(transactionUuid)}`;
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('eSewa status check failed:', err);
      return null;
    }
  }

  /**
   * Refund payment
   * @param {String} paymentId - Payment ID
   * @param {Number} refundAmount - Refund amount (optional, defaults to full amount)
   * @param {String} reason - Refund reason
   * @returns {Promise<Object>}
   */
  async refundPayment(paymentId, refundAmount, reason) {
    const payment = await this.getById(paymentId);

    if (payment.status !== 'completed') {
      throw new Error('Only completed payments can be refunded');
    }

    const amount = refundAmount || payment.amount;

    if (amount > payment.amount) {
      throw new Error('Refund amount cannot exceed payment amount');
    }

    // Handle Stripe refund
    if (payment.paymentMethod === 'stripe' && payment.paymentIntentId) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      try {
        const refund = await stripe.refunds.create({
          payment_intent: payment.paymentIntentId,
          amount: Math.round((amount / 135) * 100), // Convert NPR to USD cents
          reason: reason ? 'requested_by_customer' : 'requested_by_customer',
          metadata: {
            reason: reason || 'Customer requested refund'
          }
        });

        return this.repository.refund(paymentId, amount, reason, refund.id);
      } catch (error) {
        console.error('Stripe refund failed:', error);
        throw new Error('Failed to process refund with Stripe');
      }
    }

    // For other payment methods, use existing logic
    return this.repository.refund(paymentId, amount, reason);
  }
}
