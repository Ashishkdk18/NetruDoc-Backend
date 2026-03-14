import { BaseRepository } from '../../../repositories/baseRepository.js';
import Payment from '../models/paymentModel.js';

/**
 * Payment Repository
 * Handles all database operations for payments
 */
export class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }

  /**
   * Find payments by patient
   * @param {String} patientId - Patient ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async findByPatient(patientId, options = {}) {
    return this.findAll({ patientId }, options);
  }

  /**
   * Find payments by doctor
   * @param {String} doctorId - Doctor ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async findByDoctor(doctorId, options = {}) {
    return this.findAll({ doctorId }, options);
  }

  /**
   * Find payment by appointment
   * @param {String} appointmentId - Appointment ID
   * @param {Object} options - Population options
   * @returns {Promise<Object|null>}
   */
  async findByAppointment(appointmentId, options = {}) {
    return this.findOne({ appointmentId }, options);
  }

  /**
   * Find payment by transaction ID
   * @param {String} transactionId - Transaction ID
   * @param {Object} options - Population options
   * @returns {Promise<Object|null>}
   */
  async findByTransactionId(transactionId, options = {}) {
    return this.findOne({ transactionId }, options);
  }

  /**
   * Find payment by payment intent ID (Stripe)
   * @param {String} paymentIntentId - Payment Intent ID
   * @param {Object} options - Population options
   * @returns {Promise<Object|null>}
   */
  async findByPaymentIntentId(paymentIntentId, options = {}) {
    return this.findOne({ paymentIntentId }, options);
  }

  /**
   * Update payment status
   * @param {String} paymentId - Payment ID
   * @param {String} status - New status
   * @param {Object} additionalData - Additional data to update
   * @returns {Promise<Object>}
   */
  async updateStatus(paymentId, status, additionalData = {}) {
    return this.updateById(paymentId, {
      status,
      ...additionalData
    });
  }

  /**
   * Process refund
   * @param {String} paymentId - Payment ID
   * @param {Number} refundAmount - Refund amount
   * @param {String} reason - Refund reason
   * @returns {Promise<Object>}
   */
  async refund(paymentId, refundAmount, reason) {
    return this.updateById(paymentId, {
      status: 'refunded',
      refundAmount,
      refundReason: reason,
      refundedAt: new Date()
    });
  }
}
