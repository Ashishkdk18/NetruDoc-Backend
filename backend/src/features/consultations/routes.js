import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getConsultations,
  getConsultation,
  getConsultationByAppointment,
  getIceConfig,
  startConsultation,
  endConsultation,
  updateConsultationNotes,
  updateConsultationDiagnosis,
  updateConsultationSymptoms,
  uploadConsultationMedia
} from './controllers/consultationController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.get('/', getConsultations);
router.get('/ice-config', getIceConfig);
router.get('/appointment/:appointmentId', getConsultationByAppointment);
router.get('/:id', getConsultation);
router.post('/:appointmentId/start', authorize('doctor'), startConsultation);
router.put('/:id/end', authorize('doctor'), endConsultation);
router.put('/:id/notes', authorize('doctor'), updateConsultationNotes);
router.put('/:id/diagnosis', authorize('doctor'), updateConsultationDiagnosis);
router.put('/:id/symptoms', authorize('doctor'), updateConsultationSymptoms);
router.post('/:id/media', authorize('doctor'), uploadConsultationMedia);

export default router;
