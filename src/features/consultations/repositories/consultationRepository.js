import { BaseRepository } from '../../../repositories/baseRepository.js';
import Consultation from '../models/consultationModel.js';

/**
 * Consultation Repository
 * Handles all database operations for consultations
 */
export class ConsultationRepository extends BaseRepository {
  constructor() {
    super(Consultation);
  }

  /**
   * Find consultations by patient
   * @param {String} patientId - Patient ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async findByPatient(patientId, options = {}) {
    return this.findAll({ patientId }, options);
  }

  /**
   * Find consultations by doctor
   * @param {String} doctorId - Doctor ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async findByDoctor(doctorId, options = {}) {
    return this.findAll({ doctorId }, options);
  }

  /**
   * Find consultation by appointment ID
   * @param {String} appointmentId - Appointment ID
   * @param {Object} options - Population options
   * @returns {Promise<Object|null>}
   */
  async findByAppointment(appointmentId, options = {}) {
    return this.findOne({ appointmentId }, options);
  }

  /**
   * Start consultation
   * @param {String} consultationId - Consultation ID
   * @returns {Promise<Object>}
   */
  async start(consultationId) {
    return this.updateById(consultationId, {
      status: 'active',
      startTime: new Date()
    });
  }

  /**
   * End consultation
   * @param {String} consultationId - Consultation ID
   * @param {Object} data - End consultation data (notes, diagnosis, etc.)
   * @returns {Promise<Object>}
   */
  async end(consultationId, data = {}) {
    return this.updateById(consultationId, {
      status: 'completed',
      endTime: new Date(),
      ...data
    });
  }

  /**
   * Add media to consultation
   * @param {String} consultationId - Consultation ID
   * @param {Object} mediaData - Media data
   * @returns {Promise<Object>}
   */
  async addMedia(consultationId, mediaData) {
    const consultation = await this.findById(consultationId);
    if (!consultation) {
      throw new Error('Consultation not found');
    }

    consultation.media.push(mediaData);
    return consultation.save();
  }

  /**
   * Add recording to consultation
   * @param {String} consultationId - Consultation ID
   * @param {Object} recordingData - Recording data
   * @returns {Promise<Object>}
   */
  async addRecording(consultationId, recordingData) {
    const consultation = await this.findById(consultationId);
    if (!consultation) {
      throw new Error('Consultation not found');
    }

    consultation.recordings.push(recordingData);
    return consultation.save();
  }
}
