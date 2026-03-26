import express from 'express';
import { body } from 'express-validator';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getHospitals,
  getHospital,
  getHospitalBySlug,
  createHospital,
  updateHospital,
  deleteHospital,
  getNearbyHospitals,
  addReview,
  getHospitalStats,
  verifyHospital
} from './controllers/hospitalController.js';

const router = express.Router();

// Validation rules
const hospitalValidation = [
  body('name').notEmpty().withMessage('Hospital name is required'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('contact.phone').notEmpty().withMessage('Phone number is required'),
  body('address.coordinates.coordinates').isArray().withMessage('Coordinates must be an array'),
  body('address.coordinates.coordinates').isLength({ min: 2, max: 2 }).withMessage('Coordinates must have longitude and latitude')
];

const reviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString()
];

// Public routes
router.get('/', getHospitals);
router.get('/nearby', getNearbyHospitals);
router.get('/slug/:slug', getHospitalBySlug);
router.get('/:id', getHospital);
router.get('/:id/stats', getHospitalStats);

// Protected routes
router.post('/:id/reviews', protect, reviewValidation, addReview);

// Admin only routes
router.post('/', protect, authorize('admin'), hospitalValidation, createHospital);
router.put('/:id', protect, authorize('admin'), updateHospital);
router.put('/:id/verify', protect, authorize('admin'), verifyHospital);
router.delete('/:id', protect, authorize('admin'), deleteHospital);

export default router;
