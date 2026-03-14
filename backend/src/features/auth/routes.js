import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyRegistrationOTP,
  resendOTP,
  verifyLoginOTP
} from './controllers/authController.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['patient', 'doctor']).withMessage('Role must be patient or doctor'),
  body('phone').optional().matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Please provide a valid phone number'),
  // Doctor-specific validation (checked in controller if role is doctor)
  body('licenseNumber').optional().isString().withMessage('License number must be a string'),
  body('specialization').optional().isIn([
    'general-medicine', 'cardiology', 'dermatology', 'neurology',
    'orthopedics', 'pediatrics', 'psychiatry', 'radiology',
    'surgery', 'urology', 'gynecology', 'ophthalmology'
  ]).withMessage('Invalid specialization'),
  body('qualificationDocuments').optional().isArray().withMessage('Qualification documents must be an array')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.put('/reset-password', resetPasswordValidation, resetPassword);
router.post('/verify-registration-otp', verifyRegistrationOTP);
router.post('/resend-otp', resendOTP);
router.post('/verify-login-otp', verifyLoginOTP);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

export default router;
