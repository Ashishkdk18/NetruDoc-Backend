import mongoose from 'mongoose';
import { BaseService } from '../../../services/baseService.js';
import { AppointmentRepository } from '../repositories/appointmentRepository.js';
import User from '../../users/models/userModel.js';
import { NotificationService } from '../../notifications/services/notificationService.js';
import emailService from '../../../utils/emailService.js';

/**
 * Appointment Service
 * Contains business logic for appointment operations
 */
export class AppointmentService extends BaseService {
  constructor() {
    super(new AppointmentRepository());
    this.notificationService = new NotificationService();
  }

  /**
   * Get appointments with filters
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  async getAppointments(filters = {}, pagination = {}) {
    const { userId, role, status, startDate, endDate, rescheduleStatus } = filters;

    // Validate userId if provided
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    // Validate role
    if (!role || !['patient', 'doctor', 'admin'].includes(role)) {
      throw new Error('Invalid user role');
    }

    let query = {};

    // Filter by user role
    if (role === 'patient') {
      if (!userId) {
        throw new Error('Patient ID is required');
      }
      query.patientId = userId;
    } else if (role === 'doctor') {
      if (!userId) {
        throw new Error('Doctor ID is required');
      }
      query.doctorId = userId;
    }
    // Admin can see all appointments, so no filter needed

    if (status) {
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status filter');
      }
      query.status = status;
    }

    // Optional reschedule status filter
    if (rescheduleStatus) {
      const validRescheduleStatuses = ['none', 'pending', 'approved', 'rejected'];
      if (!validRescheduleStatuses.includes(rescheduleStatus)) {
        throw new Error('Invalid reschedule status filter');
      }
      query.rescheduleStatus = rescheduleStatus;
    }

    const options = {
      page: parseInt(pagination.page) || 1,
      limit: parseInt(pagination.limit) || 10,
      sort: pagination.sort || '-date',
      populate: [
        { path: 'patientId', select: 'name email phone' },
        { path: 'doctorId', select: 'name email specialization consultationFee' }
      ]
    };

    // Date range filter
    if (startDate && endDate) {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('Invalid date range provided');
        }
        
        return await this.repository.findByDateRange(start, end, options);
      } catch (error) {
        console.error('Error in findByDateRange:', error);
        throw error;
      }
    }

    try {
      return await this.repository.findAll(query, options);
    } catch (error) {
      console.error('Error in findAll appointments:', error);
      console.error('Query:', query);
      console.error('Options:', options);
      throw error;
    }
  }

  /**
   * Get appointment by ID
   * @param {String} id - Appointment ID
   * @returns {Promise<Object>}
   */
  async getAppointmentById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid appointment ID format');
    }
    return this.getById(id, {
      populate: [
        { path: 'patientId', select: 'name email phone address' },
        { path: 'doctorId', select: 'name email specialization consultationFee hospital' },
        { path: 'consultationId' },
        { path: 'prescriptionId' }
      ]
    });
  }

  /**
   * Create appointment
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>}
   */
  async createAppointment(appointmentData) {
    // Normalize and validate date
    const appointmentDate = new Date(appointmentData.date);
    if (!appointmentData.date || isNaN(appointmentDate.getTime())) {
      throw new Error('Invalid date provided');
    }

    // Validate doctor availability for the requested time

    const isAvailable = await this.validateDoctorAvailability(
      appointmentData.doctorId,      
      appointmentDate,
      appointmentData.time
    );

    if (!isAvailable) {
      throw new Error('Doctor is not available at the requested time');
    }

    // Check for conflicts (double booking)
    const conflict = await this.repository.findOne({
      doctorId: appointmentData.doctorId,
      date: appointmentData.date,
      time: appointmentData.time,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (conflict) {
      throw new Error('Time slot is already booked');
    }

    return this.create(appointmentData);
  }

  /**
   * Update appointment
   * @param {String} id - Appointment ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>}
   */
  async updateAppointment(id, updateData) {
    // If date/time is being updated, validate availability and check for conflicts
    if (updateData.date || updateData.time) {
      const appointment = await this.getById(id);
      const rawDate = updateData.date || appointment.date;
      const checkDate = new Date(rawDate);
      if (!rawDate || isNaN(checkDate.getTime())) {
        throw new Error('Invalid date provided');
      }
      const checkTime = updateData.time || appointment.time;

      // Validate doctor availability
      const isAvailable = await this.validateDoctorAvailability(
        appointment.doctorId,
        checkDate,
        checkTime
      );

      if (!isAvailable) {
        throw new Error('Doctor is not available at the requested time');
      }

      // Check for conflicts (double booking)
      const conflict = await this.repository.findOne({
        doctorId: appointment.doctorId,
        date: checkDate,
        time: checkTime,
        status: { $in: ['pending', 'confirmed'] },
        _id: { $ne: id }
      });

      if (conflict) {
        throw new Error('Time slot is already booked');
      }
    }

    return this.update(id, updateData);
  }

  /**
   * Get available slots for a doctor
   * @param {String} doctorId - Doctor ID
   * @param {Date} date - Date to check
   * @returns {Promise<Array>}
   */
  async getAvailableSlots(doctorId, date) {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new Error('Invalid doctor ID format');
    }

    // Validate date
    if (!date || isNaN(new Date(date).getTime())) {
      throw new Error('Invalid date provided');
    }

    const checkDate = new Date(date);

    // Get doctor to check availability schedule
    const doctor = await User.findById(doctorId).select('availability');

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Get day of week (lowercase)
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = daysOfWeek[checkDate.getDay()];

    // Check if doctor is available on this day
    const dayAvailability = doctor.availability?.[dayOfWeek];

    if (!dayAvailability || !dayAvailability.available) {
      return []; // Doctor not available on this day
    }

    // Get booked slots
    const bookedSlots = await this.repository.getBookedSlots(doctorId, checkDate);

    // Generate available slots based on doctor's working hours
    const availableSlots = this.generateTimeSlots(dayAvailability.start, dayAvailability.end);

    // Filter out booked slots
    return availableSlots.filter(slot => !bookedSlots.includes(slot));
  }

  /**
   * Generate time slots between start and end time
   * @param {String} startTime - Start time (HH:MM format)
   * @param {String} endTime - End time (HH:MM format)
   * @returns {Array} - Array of time slots in HH:MM format
   */
  generateTimeSlots(startTime, endTime) {
    const slots = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Generate 30-minute slots
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }

    return slots;
  }

  /**
   * Validate doctor availability for a specific date and time
   * @param {String} doctorId - Doctor ID
   * @param {Date} date - Date to check
   * @param {String} time - Time to check (HH:MM format)
   * @returns {Promise<Boolean>} - True if doctor is available at this time
   */
  async validateDoctorAvailability(doctorId, date, time) {
    try {
      // Get doctor to check availability schedule
      const doctor = await User.findById(doctorId).select('availability');

      if (!doctor) {
        return false;
      }

      // Get day of week (lowercase)
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = daysOfWeek[date.getDay()];

      // Check if doctor is available on this day
      const dayAvailability = doctor.availability?.[dayOfWeek];

      if (!dayAvailability || !dayAvailability.available) {
        return false; // Doctor not available on this day
      }

      // Check if the time falls within doctor's working hours
      const [timeHour, timeMinute] = time.split(':').map(Number);
      const [startHour, startMinute] = dayAvailability.start.split(':').map(Number);
      const [endHour, endMinute] = dayAvailability.end.split(':').map(Number);

      const timeMinutes = timeHour * 60 + timeMinute;
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      return timeMinutes >= startMinutes && timeMinutes < endMinutes;
    } catch (error) {
      console.error('Error validating doctor availability:', error);
      return false;
    }
  }

  /**
   * Request reschedule for an appointment
   * @param {String} appointmentId - Appointment ID
   * @param {Date} newDate - New appointment date
   * @param {String} newTime - New appointment time
   * @param {String} requestedBy - User ID requesting reschedule
   * @param {String} reason - Reason for reschedule
   * @returns {Promise<Object>}
   */
  async rescheduleAppointment(appointmentId, newDate, newTime, requestedBy, reason) {
    try {
      // Normalize and validate date
      const normalizedDate = new Date(newDate);
      if (!newDate || isNaN(normalizedDate.getTime())) {
        throw new Error('Invalid date provided');
      }

      // Normalize date to start of day for consistent comparison
      normalizedDate.setHours(0, 0, 0, 0);

      const appointment = await this.getById(appointmentId);

      if (!appointment) {
        throw new Error('Resource not found');
      }

      // Only pending or confirmed appointments can be rescheduled
      if (!['pending', 'confirmed'].includes(appointment.status)) {
        throw new Error('Cannot reschedule appointment with current status');
      }

      // Check if already has a pending reschedule request
      if (appointment.rescheduleStatus === 'pending') {
        throw new Error('Appointment already has a pending reschedule request');
      }

      // Ensure doctorId is properly formatted (handle both ObjectId and populated object)
      let doctorId;
      if (!appointment.doctorId) {
        throw new Error('Appointment doctor ID is missing');
      }
      
      // Handle ObjectId, populated object, or string
      if (mongoose.Types.ObjectId.isValid(appointment.doctorId)) {
        if (typeof appointment.doctorId === 'object' && appointment.doctorId._id) {
          // Populated object
          doctorId = appointment.doctorId._id.toString();
        } else if (appointment.doctorId.toString) {
          // ObjectId instance
          doctorId = appointment.doctorId.toString();
        } else {
          doctorId = String(appointment.doctorId);
        }
      } else {
        doctorId = String(appointment.doctorId);
      }

      if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
        throw new Error('Invalid doctor ID format');
      }

      // Validate doctor availability for new time
      const isAvailable = await this.validateDoctorAvailability(
        doctorId,
        normalizedDate,
        newTime
      );

      if (!isAvailable) {
        throw new Error('Doctor is not available at the requested new time');
      }

      // Check for conflicts at new time
      // Use date range query to match the same day
      const startOfDay = new Date(normalizedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(normalizedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const conflict = await this.repository.findOne({
        doctorId: doctorId,
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        time: newTime,
        status: { $in: ['pending', 'confirmed'] },
        _id: { $ne: appointmentId }
      });

      if (conflict) {
        throw new Error('New time slot is already booked');
      }

      // Update appointment with reschedule request
      const updatedAppointment = await this.update(appointmentId, {
        rescheduleRequestedAt: new Date(),
        rescheduleRequestedBy: requestedBy,
        rescheduleReason: reason,
        rescheduleStatus: 'pending',
        rescheduleNewDate: normalizedDate,
        rescheduleNewTime: newTime
      });

      // Send notification to doctor (non-blocking)
      this.getById(appointmentId, {
        populate: [
          { path: 'doctorId', select: 'name' },
          { path: 'patientId', select: 'name' }
        ]
      }).then((appointment) => {
        if (appointment && appointment.doctorId && appointment.patientId) {
          const doctorId = appointment.doctorId._id || appointment.doctorId;
          const doctorName = appointment.doctorId.name || 'Doctor';
          const patientName = appointment.patientId.name || 'Patient';
          
          this.notificationService.sendAppointmentNotification(
            doctorId,
            'appointment_reschedule_requested',
            {
              appointmentId: appointment._id.toString(),
              doctorId: doctorId.toString(),
              doctorName: doctorName,
              patientName: patientName,
              newDate: normalizedDate.toISOString().split('T')[0],
              newTime: newTime,
              reason: reason
            }
          ).catch(err => console.error('Failed to send reschedule notification:', err));
        }
      }).catch(err => console.error('Failed to fetch appointment for notification:', err));

      return updatedAppointment;
    } catch (error) {
      console.error('Error in rescheduleAppointment:', error);
      // Re-throw known errors, wrap unknown ones
      if (error.message && (
        error.message.includes('not found') ||
        error.message.includes('Cannot reschedule') ||
        error.message.includes('already has') ||
        error.message.includes('not available') ||
        error.message.includes('already booked') ||
        error.message.includes('Invalid')
      )) {
        throw error;
      }
      throw new Error(`Failed to reschedule appointment: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Approve or reject reschedule request
   * @param {String} appointmentId - Appointment ID
   * @param {String} action - 'approve' or 'reject'
   * @param {String} approvedBy - User ID approving/rejecting
   * @returns {Promise<Object>}
   */
  async handleRescheduleRequest(appointmentId, action, approvedBy) {
    const appointment = await this.getById(appointmentId);

    if (appointment.rescheduleStatus !== 'pending') {
      throw new Error('No pending reschedule request found');
    }

    let updatedAppointment;
    if (action === 'approve') {
      // Update appointment with new date/time and mark as approved
      updatedAppointment = await this.update(appointmentId, {
        date: appointment.rescheduleNewDate,
        time: appointment.rescheduleNewTime,
        rescheduleStatus: 'approved',
        rescheduleApprovedAt: new Date(),
        rescheduleApprovedBy: approvedBy
      });

      // Send notification to patient (non-blocking)
      this.getById(appointmentId, {
        populate: [
          { path: 'doctorId', select: 'name' },
          { path: 'patientId', select: 'name' }
        ]
      }).then((appointment) => {
        if (appointment && appointment.doctorId && appointment.patientId) {
          const patientId = appointment.patientId._id || appointment.patientId;
          const doctorName = appointment.doctorId.name || 'Doctor';
          const newDate = appointment.date instanceof Date 
            ? appointment.date.toISOString().split('T')[0]
            : new Date(appointment.date).toISOString().split('T')[0];
          
          this.notificationService.sendAppointmentNotification(
            patientId,
            'appointment_reschedule_approved',
            {
              appointmentId: appointment._id.toString(),
              doctorId: (appointment.doctorId._id || appointment.doctorId).toString(),
              doctorName: doctorName,
              newDate: newDate,
              newTime: appointment.time
            }
          ).catch(err => console.error('Failed to send approval notification:', err));
        }
      }).catch(err => console.error('Failed to fetch appointment for notification:', err));
    } else if (action === 'reject') {
      // Mark reschedule as rejected
      updatedAppointment = await this.update(appointmentId, {
        rescheduleStatus: 'rejected'
      });

      // Send notification to patient (non-blocking)
      this.getById(appointmentId, {
        populate: [
          { path: 'doctorId', select: 'name' },
          { path: 'patientId', select: 'name' }
        ]
      }).then((appointment) => {
        if (appointment && appointment.doctorId && appointment.patientId) {
          const patientId = appointment.patientId._id || appointment.patientId;
          const doctorName = appointment.doctorId.name || 'Doctor';
          
          this.notificationService.sendAppointmentNotification(
            patientId,
            'appointment_reschedule_rejected',
            {
              appointmentId: appointment._id.toString(),
              doctorId: (appointment.doctorId._id || appointment.doctorId).toString(),
              doctorName: doctorName
            }
          ).catch(err => console.error('Failed to send rejection notification:', err));
        }
      }).catch(err => console.error('Failed to fetch appointment for notification:', err));
    } else {
      throw new Error('Invalid action. Must be "approve" or "reject"');
    }

    return updatedAppointment;
  }

  /**
   * Get doctor's schedule for a date range
   * @param {String} doctorId - Doctor ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>}
   */
  async getDoctorSchedule(doctorId, startDate, endDate) {
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new Error('Invalid doctor ID format');
    }

    if (!startDate || isNaN(new Date(startDate).getTime())) {
      throw new Error('Invalid start date provided');
    }

    if (!endDate || isNaN(new Date(endDate).getTime())) {
      throw new Error('Invalid end date provided');
    }

    const result = await this.repository.findByDoctorAndDateRange(
      doctorId,
      new Date(startDate),
      new Date(endDate),
      {
        populate: [
          { path: 'patientId', select: 'name email phone' }
        ]
      }
    );
    return result.data || result.items || [];
  }

  /**
   * Confirm appointment
   * @param {String} appointmentId - Appointment ID
   * @returns {Promise<Object>}
   */
  async confirmAppointment(appointmentId) {
    const appointment = await this.getById(appointmentId);

    if (appointment.status !== 'pending') {
      throw new Error('Only pending appointments can be confirmed');
    }

    const updatedAppointment = await this.repository.confirm(appointmentId);

    // Best-effort email notification to patient
    try {
      const populated = await this.getAppointmentById(appointmentId);
      const patient = populated.patientId;
      const doctor = populated.doctorId;

      if (patient?.email) {
        await emailService.sendAppointmentStatusEmail(patient.email, 'confirmed', {
          patientName: patient.name,
          doctorName: doctor?.name,
          date: populated.date,
          time: populated.time
        });
      }
    } catch (error) {
      console.error('Failed to send appointment confirmation email:', error);
    }

    return updatedAppointment;
  }

  /**
   * Cancel appointment
   * @param {String} appointmentId - Appointment ID
   * @param {String} userId - User ID who cancelled
   * @param {String} reason - Cancellation reason
   * @returns {Promise<Object>}
   */
  async cancelAppointment(appointmentId, userId, reason) {
    const appointment = await this.getById(appointmentId);

    if (appointment.status === 'cancelled') {
      throw new Error('Appointment is already cancelled');
    }

    if (appointment.status === 'completed') {
      throw new Error('Cannot cancel completed appointment');
    }

    const cancelledAppointment = await this.repository.cancel(appointmentId, userId, reason);

    // Best-effort email notification to patient
    try {
      const populated = await this.getAppointmentById(appointmentId);
      const patient = populated.patientId;
      const doctor = populated.doctorId;

      if (patient?.email) {
        await emailService.sendAppointmentStatusEmail(patient.email, 'cancelled', {
          patientName: patient.name,
          doctorName: doctor?.name,
          date: populated.date,
          time: populated.time,
          reason
        });
      }
    } catch (error) {
      console.error('Failed to send appointment cancellation email:', error);
    }

    return cancelledAppointment;
  }
}
