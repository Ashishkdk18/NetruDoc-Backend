import express from 'express';
import { body } from 'express-validator';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  deletePrescription,
  downloadPrescription
} from './controllers/prescriptionController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const prescriptionValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('medications').isArray({ min: 1 }).withMessage('At least one medication is required'),
  body('diagnoses').isArray({ min: 1 }).withMessage('At least one diagnosis is required')
];

// Routes
router.get('/', getPrescriptions);
router.get('/:id', getPrescription);
router.get('/:id/download', downloadPrescription);
router.post('/', authorize('doctor'), prescriptionValidation, createPrescription);
router.put('/:id', authorize('doctor'), updatePrescription);
router.delete('/:id', authorize('admin'), deletePrescription);

export default router;
