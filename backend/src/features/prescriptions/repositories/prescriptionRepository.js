import { BaseRepository } from '../../../repositories/baseRepository.js';
import Prescription from '../models/prescriptionModel.js';

/**
 * Prescription Repository
 * Handles all database operations for prescriptions
 */
export class PrescriptionRepository extends BaseRepository {
  constructor() {
    super(Prescription);
  }

  /**
   * Find prescriptions by patient
   * @param {String} patientId - Patient ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async findByPatient(patientId, options = {}) {
    return this.findAll({ patientId, isActive: true }, options);
  }

  /**
   * Find prescriptions by doctor
   * @param {String} doctorId - Doctor ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async findByDoctor(doctorId, options = {}) {
    return this.findAll({ doctorId, isActive: true }, options);
  }

  /**
   * Find prescription by appointment
   * @param {String} appointmentId - Appointment ID
   * @param {Object} options - Population options
   * @returns {Promise<Object|null>}
   */
  async findByAppointment(appointmentId, options = {}) {
    return this.findOne({ appointmentId }, options);
  }

  /**
   * Find prescription by consultation
   * @param {String} consultationId - Consultation ID
   * @param {Object} options - Population options
   * @returns {Promise<Object|null>}
   */
  async findByConsultation(consultationId, options = {}) {
    return this.findOne({ consultationId }, options);
  }

  /**
   * Deactivate prescription
   * @param {String} prescriptionId - Prescription ID
   * @returns {Promise<Object>}
   */
  async deactivate(prescriptionId) {
    return this.updateById(prescriptionId, { isActive: false });
  }
}
