import { NotificationService } from '../services/notificationService.js';
import { successResponse, errorResponse, paginatedSuccessResponse, RESPONSE_MESSAGES } from '../../../utils/response.js';

const notificationService = new NotificationService();

// @desc    Get notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const filters = {
      unreadOnly: req.query.unreadOnly,
      type: req.query.type
    };

    const pagination = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sort: req.query.sort || '-createdAt'
    };

    const result = await notificationService.getNotifications(req.user._id, filters, pagination);

    // Ensure pagination metadata has correct structure
    const paginationMeta = result.pagination || {};
    const paginationData = {
      page: paginationMeta.page || 1,
      limit: paginationMeta.limit || 20,
      total: paginationMeta.total || 0,
      pages: paginationMeta.totalPages || Math.ceil((paginationMeta.total || 0) / (paginationMeta.limit || 20))
    };

    res.status(200).json(paginatedSuccessResponse(
      RESPONSE_MESSAGES.NOTIFICATIONS_FETCHED,
      result.data || [],
      paginationData
    ));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse('Failed to fetch notifications'));
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);

    res.status(200).json(successResponse('Unread count retrieved successfully', { count }));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse('Failed to fetch unread count'));
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.NOTIFICATION_MARKED_READ, { notification }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Notification not found'));
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to mark notification as read'));
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user._id);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.ALL_NOTIFICATIONS_MARKED_READ));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse('Failed to mark all notifications as read'));
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.user._id);

    res.status(200).json(successResponse('Notification deleted successfully'));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Notification not found'));
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to delete notification'));
  }
};

// @desc    Create notification (Admin/System)
// @route   POST /api/notifications
// @access  Private (Admin only)
export const createNotification = async (req, res) => {
  try {
    const notification = await notificationService.createNotification(req.body);

    res.status(201).json(successResponse('Notification created successfully', { notification }));
  } catch (error) {
    console.error(error);
    if (error.message.includes('Missing required')) {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to create notification'));
  }
};