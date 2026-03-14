import express from 'express';
import { body } from 'express-validator';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAvailableSlots,
  confirmAppointment,
  cancelAppointment,
  requestReschedule,
  handleRescheduleRequest,
  getDoctorSchedule
} from './controllers/appointmentController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const appointmentValidation = [
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  body('reason').notEmpty().withMessage('Appointment reason is required')
];

const rescheduleValidation = [
  body('newDate').isISO8601().withMessage('Valid new date is required'),
  body('newTime').notEmpty().withMessage('New time is required'),
  body('reason').notEmpty().withMessage('Reschedule reason is required')
];

// Routes
router.get('/', getAppointments);
router.get('/available-slots/:doctorId', getAvailableSlots);
router.get('/doctor/schedule', authorize('doctor'), getDoctorSchedule);
router.get('/:id', getAppointment);
router.post('/', appointmentValidation, createAppointment);
router.put('/:id', updateAppointment);
router.put('/:id/confirm', authorize('doctor'), confirmAppointment);
router.put('/:id/cancel', cancelAppointment);
router.put('/:id/reschedule', rescheduleValidation, requestReschedule);
router.put('/:id/handle-reschedule', authorize('doctor', 'admin'), handleRescheduleRequest);
router.delete('/:id', authorize('admin'), deleteAppointment);

export default router;
