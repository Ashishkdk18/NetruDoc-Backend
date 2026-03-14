import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getDoctors,
  getPatients,
  activateUser,
  deactivateUser,
  getDoctorAvailability,
  updateDoctorAvailability
} from './controllers/userController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/doctors', getDoctors);

// All routes below require authentication
router.use(protect);

// Admin only routes
router.get('/', authorize('admin'), getUsers);
router.get('/patients', authorize('admin'), getPatients);

// User-specific routes (must come after specific routes to avoid conflicts)
router.get('/:id', getUser);

// Doctor availability routes
router.get('/doctor/availability', authorize('doctor'), getDoctorAvailability);
router.put('/doctor/availability', authorize('doctor'), updateDoctorAvailability);

// Admin only routes for user management
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.put('/:id/activate', authorize('admin'), activateUser);
router.put('/:id/deactivate', authorize('admin'), deactivateUser);

export default router;
