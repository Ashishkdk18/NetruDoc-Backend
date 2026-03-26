import { BaseRepository } from '../../../repositories/baseRepository.js';
import Appointment from '../models/appointmentModel.js';

/**
 * Appointment Repository
 * Handles all database operations for appointments
 */
export class AppointmentRepository extends BaseRepository {
  constructor() {
    super(Appointment);
  }

  /**
   * Find appointments by patient
   * @param {String} patientId - Patient ID
   * @param {Object} options - Pagination and filtering options
   * @returns {Promise<Object>}
   */
  async findByPatient(patientId, options = {}) {
    return this.findAll({ patientId }, options);
  }

  /**
   * Find appointments by doctor
   * @param {String} doctorId - Doctor ID
   * @param {Object} options - Pagination and filtering options
   * @returns {Promise<Object>}
   */
  async findByDoctor(doctorId, options = {}) {
    return this.findAll({ doctorId }, options);
  }

  /**
   * Find appointments by status
   * @param {String} status - Appointment status
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async findByStatus(status, options = {}) {
    return this.findAll({ status }, options);
  }

  /**
   * Find appointments by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async findByDateRange(startDate, endDate, options = {}) {
    const query = {
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };

    return this.findAll(query, options);
  }

  /**
   * Find available time slots for a doctor on a specific date
   * @param {String} doctorId - Doctor ID
   * @param {Date} date - Appointment date
   * @returns {Promise<Array>}
   */
  async getBookedSlots(doctorId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.model.find({
      doctorId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['pending', 'confirmed'] }
    }).select('time');

    return appointments.map(apt => apt.time);
  }

  /**
   * Cancel appointment
   * @param {String} appointmentId - Appointment ID
   * @param {String} cancelledBy - User ID who cancelled
   * @param {String} reason - Cancellation reason
   * @returns {Promise<Object>}
   */
  async cancel(appointmentId, cancelledBy, reason) {
    return this.updateById(appointmentId, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy,
      cancellationReason: reason
    });
  }

  /**
   * Confirm appointment
   * @param {String} appointmentId - Appointment ID
   * @returns {Promise<Object>}
   */
  async confirm(appointmentId) {
    return this.updateById(appointmentId, {
      status: 'confirmed'
    });
  }

  /**
   * Find appointments by doctor and date range
   * @param {String} doctorId - Doctor ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} options - Options for population and sorting
   * @returns {Promise<Array>}
   */
  async findByDoctorAndDateRange(doctorId, startDate, endDate, options = {}) {
    const query = {
      doctorId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };

    return this.findAll(query, options);
  }
}
