import { BaseService } from '../../../services/baseService.js';
import { ConsultationRepository } from '../repositories/consultationRepository.js';
import Appointment from '../../appointments/models/appointmentModel.js';

/**
 * Consultation Service
 * Contains business logic for consultation operations
 */
export class ConsultationService extends BaseService {
  constructor() {
    super(new ConsultationRepository());
  }

  /**
   * Get consultations with filters
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  async getConsultations(filters = {}, pagination = {}) {
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
      sort: pagination.sort || '-startTime',
      populate: [
        { path: 'patientId', select: 'name email phone' },
        { path: 'doctorId', select: 'name email specialization' },
        { path: 'appointmentId' }
      ]
    };

    return this.repository.findAll(query, options);
  }

  /**
   * Get consultation by ID
   * @param {String} id - Consultation ID
   * @returns {Promise<Object>}
   */
  async getConsultationById(id) {
    return this.getById(id, {
      populate: [
        { path: 'patientId', select: 'name email phone address' },
        { path: 'doctorId', select: 'name email specialization' },
        { path: 'appointmentId' },
        { path: 'prescriptionId' }
      ]
    });
  }

  /**
   * Start consultation
   * @param {String} appointmentId - Appointment ID
   * @returns {Promise<Object>}
   */
  async startConsultation(appointmentId) {
    // Check if appointment exists and is confirmed
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.status !== 'confirmed') {
      throw new Error('Appointment must be confirmed before starting consultation');
    }

    // Check if consultation already exists
    const existingConsultation = await this.repository.findByAppointment(appointmentId);
    if (existingConsultation) {
      if (existingConsultation.status === 'active') {
        throw new Error('Consultation is already active');
      }
      // Resume existing consultation
      return this.repository.start(existingConsultation._id);
    }

    // Create new consultation
    const consultation = await this.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      startTime: new Date(),
      status: 'active'
    });

    return consultation;
  }

  /**
   * End consultation
   * @param {String} consultationId - Consultation ID
   * @param {Object} data - End consultation data
   * @returns {Promise<Object>}
   */
  async endConsultation(consultationId, data) {
    const consultation = await this.getById(consultationId);

    if (consultation.status !== 'active') {
      throw new Error('Only active consultations can be ended');
    }

    return this.repository.end(consultationId, data);
  }

  /**
   * Update consultation notes
   * @param {String} consultationId - Consultation ID
   * @param {String} notes - Consultation notes
   * @returns {Promise<Object>}
   */
  async updateNotes(consultationId, notes) {
    return this.update(consultationId, { notes });
  }

  /**
   * Update consultation diagnosis
   * @param {String} consultationId - Consultation ID
   * @param {Array<String>} diagnosis - Diagnosis array
   * @returns {Promise<Object>}
   */
  async updateDiagnosis(consultationId, diagnosis) {
    return this.update(consultationId, { diagnosis });
  }

  /**
   * Update consultation symptoms
   * @param {String} consultationId - Consultation ID
   * @param {Array<String>} symptoms - Symptoms array
   * @returns {Promise<Object>}
   */
  async updateSymptoms(consultationId, symptoms) {
    return this.update(consultationId, { symptoms });
  }

  /**
   * Upload consultation media
   * @param {String} consultationId - Consultation ID
   * @param {Object} mediaData - Media data
   * @returns {Promise<Object>}
   */
  async uploadMedia(consultationId, mediaData) {
    const consultation = await this.getById(consultationId);

    if (consultation.status === 'completed') {
      throw new Error('Cannot add media to completed consultation');
    }

    return this.repository.addMedia(consultationId, mediaData);
  }
}
