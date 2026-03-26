import mongoose from 'mongoose';
import { AppointmentService } from '../services/appointmentService.js';
import { AuditService } from '../../audit/services/auditService.js';
import { successResponse, errorResponse, RESPONSE_MESSAGES } from '../../../utils/response.js';

const appointmentService = new AppointmentService();
const auditService = new AuditService();

// @desc    Get appointments
// @route   GET /api/appointments
// @access  Private
export const getAppointments = async (req, res) => {
  try {
    // Ensure user is authenticated and has valid ID
    if (!req.user || !req.user._id) {
      return res.status(401).json(errorResponse('User not authenticated'));
    }

    // Allow admin to filter by patientId
    let userId = req.user._id;
    let role = req.user.role;
    
    if (req.user.role === 'admin' && req.query.patientId) {
      // Admin can view appointments for a specific patient
      userId = req.query.patientId;
      role = 'patient';
    }

    const filters = {
      userId: userId,
      role: role,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      rescheduleStatus: req.query.rescheduleStatus
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sort: req.query.sort || '-date'
    };

    const result = await appointmentService.getAppointments(filters, pagination);

    // Ensure result has proper structure
    const appointments = result.data || result.items || [];
    const paginationInfo = result.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    };

    res.status(200).json(successResponse(RESPONSE_MESSAGES.APPOINTMENTS_FETCHED, {
      items: appointments,
      pagination: paginationInfo
    }));
  } catch (error) {
    console.error('Error fetching appointments:', error);
    if (error.message && error.message.includes('Invalid user ID format')) {
      return res.status(400).json(errorResponse(error.message));
    }
    // Log full error for debugging
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json(errorResponse('Failed to fetch appointments: ' + (error.message || 'Unknown error')));
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json(errorResponse('User not authenticated'));
    }

    // Validate appointment ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(errorResponse('Invalid appointment ID format'));
    }

    const appointment = await appointmentService.getAppointmentById(id);

    // Authorization: only patient, assigned doctor, or admin can view
    const userId = req.user._id.toString();
    const role = req.user.role;

    const patientId = (appointment?.patientId?._id || appointment?.patientId)?.toString?.() || String(appointment?.patientId);
    const doctorId = (appointment?.doctorId?._id || appointment?.doctorId)?.toString?.() || String(appointment?.doctorId);

    const isAdmin = role === 'admin';
    const isPatient = patientId === userId;
    const isDoctor = doctorId === userId;

    if (!isAdmin && !isPatient && !isDoctor) {
      return res.status(403).json(errorResponse('Not authorized to view this appointment'));
    }

    res.status(200).json(successResponse(RESPONSE_MESSAGES.APPOINTMENT_FETCHED, { appointment }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Appointment not found'));
    }
    res.status(500).json(errorResponse('Failed to fetch appointment'));
  }
};

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private
export const createAppointment = async (req, res) => {
  try {
    // Validate pre-consultation form
    if (!req.body.preConsultationForm) {
      return res.status(400).json(errorResponse('Pre-consultation form is required'));
    }

    const { preConsultationForm } = req.body;

    // Validate symptoms (at least one required)
    if (!preConsultationForm.symptoms || !Array.isArray(preConsultationForm.symptoms) || preConsultationForm.symptoms.length === 0) {
      return res.status(400).json(errorResponse('At least one symptom must be specified'));
    }

    // Validate array fields are actually arrays
    const arrayFields = ['symptoms', 'currentMedications', 'allergies'];
    for (const field of arrayFields) {
      if (preConsultationForm[field] && !Array.isArray(preConsultationForm[field])) {
        return res.status(400).json(errorResponse(`${field} must be an array`));
      }
    }

    // Validate string fields
    if (preConsultationForm.medicalHistory && typeof preConsultationForm.medicalHistory !== 'string') {
      return res.status(400).json(errorResponse('Medical history must be a string'));
    }

    if (preConsultationForm.additionalNotes && typeof preConsultationForm.additionalNotes !== 'string') {
      return res.status(400).json(errorResponse('Additional notes must be a string'));
    }

    // Validate string length limits
    if (preConsultationForm.medicalHistory && preConsultationForm.medicalHistory.length > 2000) {
      return res.status(400).json(errorResponse('Medical history cannot exceed 2000 characters'));
    }

    if (preConsultationForm.additionalNotes && preConsultationForm.additionalNotes.length > 1000) {
      return res.status(400).json(errorResponse('Additional notes cannot exceed 1000 characters'));
    }

    const appointmentData = {
      ...req.body,
      patientId: req.user.role === 'patient' ? req.user._id : req.body.patientId
    };

    const appointment = await appointmentService.createAppointment(appointmentData);

    res.status(201).json(successResponse(RESPONSE_MESSAGES.APPOINTMENT_CREATED, { appointment }));

    // Audit appointment creation
    try {
      await auditService.logAction(
        'appointment',
        appointment._id,
        'create',
        req.user._id.toString(),
        req.user.role,
        req,
        { doctorId: appointment.doctorId, date: appointment.date, timeSlot: appointment.timeSlot }
      );
    } catch (auditError) {
      console.error('Failed to log appointment create audit event:', auditError);
    }
  } catch (error) {
    console.error('Error creating appointment:', error);
    if (error.message === 'Time slot is already booked' || error.message === 'Doctor is not available at the requested time') {
      return res.status(400).json(errorResponse(error.message));
    }
    if (error.message === 'Doctor not found') {
      return res.status(404).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to create appointment'));
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate appointment ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(errorResponse('Invalid appointment ID format'));
    }

    const appointment = await appointmentService.updateAppointment(id, req.body);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.APPOINTMENT_UPDATED, { appointment }));

    // Audit appointment update
    try {
      await auditService.logAction(
        'appointment',
        appointment._id,
        'update',
        req.user._id.toString(),
        req.user.role,
        req,
        { changes: Object.keys(req.body || {}) }
      );
    } catch (auditError) {
      console.error('Failed to log appointment update audit event:', auditError);
    }
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Appointment not found'));
    }
    if (error.message === 'Time slot is already booked') {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to update appointment'));
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private (Admin only)
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate appointment ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(errorResponse('Invalid appointment ID format'));
    }

    const deletedAppointment = await appointmentService.getAppointmentById(id).catch(() => null);
    await appointmentService.delete(id);

    res.status(200).json(successResponse('Appointment deleted successfully'));

    // Audit appointment delete
    try {
      await auditService.logAction(
        'appointment',
        id,
        'delete',
        req.user._id.toString(),
        req.user.role,
        req,
        deletedAppointment ? { doctorId: deletedAppointment.doctorId, patientId: deletedAppointment.patientId } : {}
      );
    } catch (auditError) {
      console.error('Failed to log appointment delete audit event:', auditError);
    }
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Appointment not found'));
    }
    res.status(500).json(errorResponse('Failed to delete appointment'));
  }
};

// @desc    Get available slots
// @route   GET /api/appointments/available-slots/:doctorId
// @access  Private
export const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Validate doctorId
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json(errorResponse('Invalid doctor ID format'));
    }

    let date;
    if (req.query.date) {
      date = new Date(req.query.date);
      if (isNaN(date.getTime())) {
        return res.status(400).json(errorResponse('Invalid date format'));
      }
    } else {
      date = new Date();
    }

    const slots = await appointmentService.getAvailableSlots(doctorId, date);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.SLOTS_FETCHED, { slots }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Doctor not found') {
      return res.status(404).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to fetch available slots'));
  }
};

// @desc    Confirm appointment
// @route   PUT /api/appointments/:id/confirm
// @access  Private (Doctor only)
export const confirmAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate appointment ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(errorResponse('Invalid appointment ID format'));
    }

    const appointment = await appointmentService.confirmAppointment(id);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.APPOINTMENT_CONFIRMED, { appointment }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Appointment not found'));
    }
    if (error.message === 'Only pending appointments can be confirmed') {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to confirm appointment'));
  }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate appointment ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(errorResponse('Invalid appointment ID format'));
    }

    const appointment = await appointmentService.cancelAppointment(
      id,
      req.user._id,
      req.body.reason
    );

    res.status(200).json(successResponse(RESPONSE_MESSAGES.APPOINTMENT_CANCELLED, { appointment }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Appointment not found'));
    }
    if (error.message.includes('already cancelled') || error.message.includes('Cannot cancel')) {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to cancel appointment'));
  }
};

// @desc    Request reschedule appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private
export const requestReschedule = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate appointment ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(errorResponse('Invalid appointment ID format'));
    }

    const { newDate, newTime, reason } = req.body;

    if (!newDate || !newTime || !reason) {
      return res.status(400).json(errorResponse('New date, time, and reason are required'));
    }

    // Validate date format
    const appointmentDate = new Date(newDate);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json(errorResponse('Invalid date format'));
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newTime)) {
      return res.status(400).json(errorResponse('Invalid time format. Use HH:MM format'));
    }

    const appointment = await appointmentService.rescheduleAppointment(
      id,
      appointmentDate,
      newTime,
      req.user._id,
      reason
    );

    res.status(200).json(successResponse('Reschedule request submitted successfully', { appointment }));
  } catch (error) {
    console.error('Error requesting reschedule:', error);
    console.error('Error stack:', error.stack);
    
    if (error.message === 'Resource not found' || error.message === 'Appointment not found') {
      return res.status(404).json(errorResponse('Appointment not found'));
    }
    if (error.message === 'Invalid date provided') {
      return res.status(400).json(errorResponse(error.message));
    }
    if (error.message.includes('already has') || error.message.includes('Cannot reschedule') ||
        error.message.includes('not available') || error.message.includes('already booked')) {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to request reschedule: ' + (error.message || 'Unknown error')));
  }
};

// @desc    Approve or reject reschedule request
// @route   PUT /api/appointments/:id/handle-reschedule
// @access  Private (Doctor/Admin only)
export const handleRescheduleRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate appointment ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(errorResponse('Invalid appointment ID format'));
    }

    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json(errorResponse('Action must be "approve" or "reject"'));
    }

    const appointment = await appointmentService.handleRescheduleRequest(
      id,
      action,
      req.user._id
    );

    const message = action === 'approve' ? 'Reschedule approved' : 'Reschedule rejected';
    res.status(200).json(successResponse(message, { appointment }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Appointment not found'));
    }
    if (error.message.includes('No pending') || error.message.includes('Invalid action')) {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to handle reschedule request'));
  }
};

// @desc    Get doctor's schedule
// @route   GET /api/appointments/doctor/schedule
// @access  Private (Doctor only)
export const getDoctorSchedule = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json(errorResponse('Start date and end date are required'));
    }

    const appointments = await appointmentService.getDoctorSchedule(
      req.user._id,
      new Date(startDate),
      new Date(endDate)
    );

    res.status(200).json(successResponse('Doctor schedule fetched successfully', { appointments }));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse('Failed to fetch doctor schedule'));
  }
};