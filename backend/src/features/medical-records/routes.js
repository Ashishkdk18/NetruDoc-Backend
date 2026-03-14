import express from 'express';
import { protect } from '../../middleware/auth.js';
import { getMedicalRecords } from './controllers/medicalRecordsController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
// Get own medical records (no patientId)
router.get('/', getMedicalRecords);
// Get specific patient's medical records (for doctors/admin)
router.get('/:patientId', getMedicalRecords);

export default router;
