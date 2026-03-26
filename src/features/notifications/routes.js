import express from 'express';
import { protect } from '../../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
} from './controllers/notificationController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

// Admin route to create notifications
router.post('/', createNotification);

export default router;
