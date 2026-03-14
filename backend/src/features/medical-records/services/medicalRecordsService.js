import Consultation from '../../consultations/models/consultationModel.js';
import Prescription from '../../prescriptions/models/prescriptionModel.js';
import Appointment from '../../appointments/models/appointmentModel.js';
import User from '../../users/models/userModel.js';

/**
 * Medical Records Service
 * Aggregates patient health data from multiple sources
 */
export class MedicalRecordsService {
  /**
   * Get medical records for a patient
   * @param {String} requesterId - ID of user requesting records
   * @param {String} requesterRole - Role of requester (patient, doctor, admin)
   * @param {String} targetPatientId - ID of patient whose records are requested (optional)
   * @returns {Promise<Object>}
   */
  async getMedicalRecords(requesterId, requesterRole, targetPatientId = null) {
    // Determine which patient's records to fetch
    const patientId = targetPatientId || requesterId;

    // Access control: patients can only view their own records
    if (requesterRole === 'patient' && patientId !== requesterId) {
      throw new Error('Not authorized to view this patient\'s medical records');
    }

    // Access control: doctors can only view records of patients they've consulted
    if (requesterRole === 'doctor' && patientId !== requesterId) {
      const hasConsulted = await this.hasDoctorConsultedPatient(requesterId, patientId);
      if (!hasConsulted) {
        throw new Error('Not authorized to view this patient\'s medical records');
      }
    }

    // Admin can view any patient's records (no additional check needed)

    // Fetch all data in parallel
    const [consultations, prescriptions, appointments, user] = await Promise.all([
      this.getConsultations(patientId),
      this.getPrescriptions(patientId),
      this.getAppointments(patientId),
      this.getUserMedicalHistory(patientId)
    ]);

    // Combine and sort by date (newest first)
    const records = [
      ...consultations.map(c => ({ ...c, recordType: 'consultation' })),
      ...prescriptions.map(p => ({ ...p, recordType: 'prescription' })),
      ...appointments.map(a => ({ ...a, recordType: 'appointment' })),
      ...user.medicalHistory.map(mh => ({ ...mh, recordType: 'medical_history' }))
    ].sort((a, b) => {
      const dateA = this.getRecordDate(a);
      const dateB = this.getRecordDate(b);
      return new Date(dateB) - new Date(dateA);
    });

    return {
      patientId,
      patientName: user.name,
      records,
      summary: {
        totalConsultations: consultations.length,
        totalPrescriptions: prescriptions.length,
        totalAppointments: appointments.length,
        medicalHistoryItems: user.medicalHistory?.length || 0
      }
    };
  }

  /**
   * Check if doctor has consulted with patient
   * @param {String} doctorId - Doctor ID
   * @param {String} patientId - Patient ID
   * @returns {Promise<Boolean>}
   */
  async hasDoctorConsultedPatient(doctorId, patientId) {
    const consultation = await Consultation.findOne({
      doctorId,
      patientId
    }).limit(1);

    const prescription = await Prescription.findOne({
      doctorId,
      patientId
    }).limit(1);

    return !!(consultation || prescription);
  }

  /**
   * Get consultations for a patient
   * @param {String} patientId - Patient ID
   * @returns {Promise<Array>}
   */
  async getConsultations(patientId) {
    return Consultation.find({ patientId })
      .populate('doctorId', 'name email specialization')
      .populate('appointmentId', 'date time reason')
      .sort({ startTime: -1 })
      .lean();
  }

  /**
   * Get prescriptions for a patient
   * @param {String} patientId - Patient ID
   * @returns {Promise<Array>}
   */
  async getPrescriptions(patientId) {
    return Prescription.find({ patientId })
      .populate('doctorId', 'name email specialization')
      .populate('appointmentId', 'date time')
      .populate('consultationId')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get appointments for a patient
   * @param {String} patientId - Patient ID
   * @returns {Promise<Array>}
   */
  async getAppointments(patientId) {
    return Appointment.find({ patientId })
      .populate('doctorId', 'name email specialization')
      .select('date time status reason preConsultationForm createdAt')
      .sort({ date: -1, time: -1 })
      .lean();
  }

  /**
   * Get user medical history
   * @param {String} patientId - Patient ID
   * @returns {Promise<Object>}
   */
  async getUserMedicalHistory(patientId) {
    const user = await User.findById(patientId)
      .select('name medicalHistory')
      .lean();
    
    if (!user) {
      throw new Error('Patient not found');
    }

    return user;
  }

  /**
   * Get date from a record for sorting
   * @param {Object} record - Record object
   * @returns {Date}
   */
  getRecordDate(record) {
    if (record.recordType === 'consultation') {
      return record.startTime || record.createdAt;
    }
    if (record.recordType === 'prescription') {
      return record.createdAt;
    }
    if (record.recordType === 'appointment') {
      return record.date || record.createdAt;
    }
    if (record.recordType === 'medical_history') {
      return record.diagnosedDate || new Date(0);
    }
    return record.createdAt || new Date(0);
  }
}
