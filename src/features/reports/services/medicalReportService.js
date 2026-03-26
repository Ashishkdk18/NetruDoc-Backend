import { BaseService } from '../../../services/baseService.js';
import { MedicalReportRepository } from '../repositories/medicalReportRepository.js';
import Appointment from '../../appointments/models/appointmentModel.js';

export class MedicalReportService extends BaseService {
  constructor() {
    super(new MedicalReportRepository());
  }

  async validateAppointmentAccess(appointmentId, user) {
    const appointment = await Appointment.findById(appointmentId)
      .select('patientId doctorId')
      .lean();

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const userId = user._id.toString();
    const isPatient = appointment.patientId.toString() === userId;
    const isDoctor = appointment.doctorId.toString() === userId;
    const isAdmin = user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new Error('Not authorized to access reports for this appointment');
    }

    return appointment;
  }

  async createReportFromFile(appointmentId, file, user, description = '') {
    const appointment = await this.validateAppointmentAccess(appointmentId, user);

    if (!file) {
      throw new Error('No file uploaded');
    }

    return this.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      uploadedBy: user._id,
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      description: description || ''
    });
  }

  async getReportsForAppointment(appointmentId, user) {
    await this.validateAppointmentAccess(appointmentId, user);

    return this.repository.findAll(
      { appointmentId },
      {
        page: 1,
        limit: 100,
        sort: '-createdAt',
        populate: [{ path: 'uploadedBy', select: 'name role' }]
      }
    );
  }
}

export default MedicalReportService;

