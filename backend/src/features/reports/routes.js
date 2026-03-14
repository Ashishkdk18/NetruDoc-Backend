import express from 'express';
import { protect } from '../../middleware/auth.js';
import { reportsUpload } from '../../config/upload.js';
import {
  uploadMedicalReport,
  getMedicalReports,
  downloadMedicalReport
} from './controllers/medicalReportController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/:appointmentId', reportsUpload.single('file'), uploadMedicalReport);
router.get('/:appointmentId', getMedicalReports);
router.get('/file/:id', downloadMedicalReport);

export default router;

