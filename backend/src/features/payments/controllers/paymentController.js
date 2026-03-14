import { PaymentService } from '../services/paymentService.js';
import { successResponse, errorResponse, RESPONSE_MESSAGES } from '../../../utils/response.js';
import Stripe from 'stripe';

const paymentService = new PaymentService();

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
export const createPaymentIntent = async (req, res) => {
  try {
    const { appointmentId, amount } = req.body;

    const result = await paymentService.createPaymentIntent(appointmentId, amount);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.PAYMENT_INTENT_CREATED, result));
  } catch (error) {
    console.error(error);
    if (error.message === 'Appointment not found') {
      return res.status(404).json(errorResponse(error.message));
    }
    if (error.message && error.message.includes('Stripe is not configured')) {
      return res.status(503).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse(error.message || 'Failed to create payment intent'));
  }
};

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    const payment = await paymentService.confirmPayment(paymentIntentId, paymentMethodId);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.PAYMENT_CONFIRMED, { payment }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Payment not found') {
      return res.status(404).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to confirm payment'));
  }
};

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
export const getPaymentHistory = async (req, res) => {
  try {
    const filters = {
      userId: req.user._id,
      role: req.user.role,
      status: req.query.status
    };

    const pagination = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sort: req.query.sort || '-createdAt'
    };

    const result = await paymentService.getPaymentHistory(filters, pagination);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.PAYMENT_HISTORY_FETCHED, result));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse('Failed to fetch payment history'));
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
export const getPayment = async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.PAYMENT_FETCHED, { payment }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Payment not found'));
    }
    res.status(500).json(errorResponse('Failed to fetch payment'));
  }
};

// @desc    Refund payment
// @route   POST /api/payments/:id/refund
// @access  Private (Admin/Doctor)
export const refundPayment = async (req, res) => {
  try {
    const { amount, reason } = req.body;

    const payment = await paymentService.refundPayment(req.params.id, amount, reason);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.PAYMENT_REFUNDED, { payment }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Payment not found'));
    }
    if (error.message.includes('can be refunded') || error.message.includes('cannot exceed')) {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to refund payment'));
  }
};

// @desc    Handle Stripe webhook
// @route   POST /api/payments/stripe/webhook
// @access  Public
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_webhook_secret';

  let event;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const result = await paymentService.handleStripeWebhook(event);

    if (result) {
      res.status(200).json(successResponse('Stripe webhook processed successfully', { payment: result }));
    } else {
      res.status(200).json(successResponse('Stripe webhook received'));
    }
  } catch (error) {
    console.error('Stripe webhook processing failed:', error);
    res.status(500).json(errorResponse('Failed to process Stripe webhook'));
  }
};

// @desc    Initialize eSewa payment
// @route   POST /api/payments/esewa/initialize
// @access  Private
export const initializeEsewaPayment = async (req, res) => {
  try {
    const { appointmentId, amount } = req.body;

    const result = await paymentService.initializeEsewaPayment(appointmentId, amount);

    res.status(200).json(successResponse('eSewa payment initialized successfully', result));
  } catch (error) {
    console.error(error);
    if (error.message === 'Appointment not found') {
      return res.status(404).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to initialize eSewa payment'));
  }
};

// @desc    Handle eSewa callback
// @route   GET /api/payments/esewa/callback
// @access  Public
export const handleEsewaCallback = async (req, res) => {
  try {
    const { data } = req.query;
    if (!data) {
      return res.status(400).json(errorResponse('Missing data parameter'));
    }

    const payment = await paymentService.handleEsewaCallback(data);

    res.status(200).json(successResponse('eSewa callback handled successfully', { payment }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Payment not found') {
      return res.status(404).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to handle eSewa callback'));
  }
};

// @desc    Handle eSewa success redirect (GET/POST - receives redirect from eSewa)
// eSewa redirects to success_url with transaction data (GET or POST depending on environment)
// This endpoint processes the payment and redirects user to frontend
// @route   GET/POST /api/payments/esewa/success-redirect
// @access  Public
export const handleEsewaSuccessRedirect = async (req, res) => {
  try {
    // eSewa may send data via GET (query) or POST (body)
    const data = req.query.data || req.body?.data;
    if (!data) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return res.redirect(`${clientUrl}/payment/success?error=no_data`);
    }

    const payment = await paymentService.handleEsewaCallback(data);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    return res.redirect(`${clientUrl}/payment/success?verified=1&appointmentId=${payment.appointmentId}`);
  } catch (error) {
    console.error('eSewa success redirect error:', error.stack || error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    return res.redirect(`${clientUrl}/payment/success?error=verification_failed`);
  }
};

// @desc    Handle eSewa failure redirect
// @route   GET/POST /api/payments/esewa/failure-redirect
// @access  Public
export const handleEsewaFailureRedirect = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  return res.redirect(`${clientUrl}/payment/failure`);
};