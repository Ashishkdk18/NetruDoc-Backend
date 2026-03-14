import express from 'express';
import { protect } from '../../middleware/auth.js';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  getPayment,
  refundPayment,
  initializeEsewaPayment,
  handleEsewaCallback,
  handleEsewaSuccessRedirect,
  handleEsewaFailureRedirect,
  handleStripeWebhook
} from './controllers/paymentController.js';

const router = express.Router();

// Public routes - Stripe webhook (raw body required)
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Public routes - eSewa redirects (must accept both GET and POST)
router.get('/esewa/callback', handleEsewaCallback);
router.get('/esewa/success-redirect', handleEsewaSuccessRedirect);
router.post('/esewa/success-redirect', handleEsewaSuccessRedirect);
router.get('/esewa/failure-redirect', handleEsewaFailureRedirect);
router.post('/esewa/failure-redirect', handleEsewaFailureRedirect);

// Protected routes
router.use(protect);

// Routes
router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);
router.get('/history', getPaymentHistory);
router.get('/:id', getPayment);
router.post('/:id/refund', refundPayment);

// eSewa integration
router.post('/esewa/initialize', initializeEsewaPayment);

export default router;
