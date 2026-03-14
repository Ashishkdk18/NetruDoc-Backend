import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getAnalyticsSummary,
  getAppointmentsByStatus,
  getAppointmentsByMonth,
  getRevenueByMonth,
  getTopSpecialties
} from './controllers/adminAnalyticsController.js';

const router = express.Router();

// Admin-only routes
router.use(protect, authorize('admin'));

router.get('/analytics/summary', getAnalyticsSummary);
router.get('/analytics/appointments-by-status', getAppointmentsByStatus);
router.get('/analytics/appointments-by-month', getAppointmentsByMonth);
router.get('/analytics/revenue-by-month', getRevenueByMonth);
router.get('/analytics/top-specialties', getTopSpecialties);

export default router;

