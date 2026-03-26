import { BaseService } from '../../../services/baseService.js';
import { NotificationRepository } from '../repositories/notificationRepository.js';
import { eventBus } from '../../../events/eventBus.js';

/**
 * Notification Service
 * Contains business logic for notification operations
 */
export class NotificationService extends BaseService {
  constructor() {
    super(new NotificationRepository());
  }

  /**
   * Get notifications for user
   * @param {String} userId - User ID
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  async getNotifications(userId, filters = {}, pagination = {}) {
    const { unreadOnly, type } = filters;

    const options = {
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      sort: pagination.sort || '-createdAt',
      unreadOnly: unreadOnly === 'true' || unreadOnly === true
    };

    if (type) {
      return this.repository.findByType(userId, type, options);
    }

    return this.repository.findByUser(userId, options);
  }

  /**
   * Get unread notification count
   * @param {String} userId - User ID
   * @returns {Promise<Number>}
   */
  async getUnreadCount(userId) {
    return this.repository.getUnreadCount(userId);
  }

  /**
   * Create notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>}
   */
  async createNotification(notificationData) {
    // Validate required fields
    if (!notificationData.userId || !notificationData.type || !notificationData.title || !notificationData.message) {
      throw new Error('Missing required notification fields');
    }

    const notification = await this.create(notificationData);

    // Emit domain-level event so transport layers (e.g., Socket.IO) can react
    try {
      eventBus.emit('notification:user', {
        userId: notification.userId?.toString?.() || notification.userId,
        notification,
      });
    } catch (error) {
      // Log but do not block main flow
      console.error('Failed to emit notification:user event:', error);
    }

    return notification;
  }

  /**
   * Create multiple notifications (bulk)
   * @param {Array} notificationsData - Array of notification data
   * @returns {Promise<Array>}
   */
  async createBulkNotifications(notificationsData) {
    return this.repository.model.insertMany(notificationsData);
  }

  /**
   * Mark notification as read
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID (for authorization)
   * @returns {Promise<Object>}
   */
  async markAsRead(notificationId, userId) {
    const notification = await this.getById(notificationId);

    // Verify ownership
    if (notification.userId.toString() !== userId.toString()) {
      throw new Error('Unauthorized to mark this notification as read');
    }

    return this.repository.markAsRead(notificationId);
  }

  /**
   * Mark all notifications as read for user
   * @param {String} userId - User ID
   * @returns {Promise<Object>}
   */
  async markAllAsRead(userId) {
    return this.repository.markAllAsRead(userId);
  }

  /**
   * Delete notification
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID (for authorization)
   * @returns {Promise<void>}
   */
  async deleteNotification(notificationId, userId) {
    const notification = await this.getById(notificationId);

    // Verify ownership
    if (notification.userId.toString() !== userId.toString()) {
      throw new Error('Unauthorized to delete this notification');
    }

    return this.delete(notificationId);
  }

  /**
   * Send appointment notification
   * @param {String} userId - User ID
   * @param {String} type - Notification type
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>}
   */
  async sendAppointmentNotification(userId, type, appointmentData) {
    const notificationTypes = {
      appointment_created: {
        title: 'Appointment Created',
        message: `Your appointment with Dr. ${appointmentData.doctorName} has been created successfully.`
      },
      appointment_confirmed: {
        title: 'Appointment Confirmed',
        message: `Your appointment with Dr. ${appointmentData.doctorName} has been confirmed.`
      },
      appointment_cancelled: {
        title: 'Appointment Cancelled',
        message: `Your appointment with Dr. ${appointmentData.doctorName} has been cancelled.`
      },
      appointment_reminder: {
        title: 'Appointment Reminder',
        message: `You have an appointment with Dr. ${appointmentData.doctorName} tomorrow at ${appointmentData.time}.`
      },
      appointment_reschedule_requested: {
        title: 'Reschedule Request Received',
        message: `Patient ${appointmentData.patientName} has requested to reschedule appointment to ${appointmentData.newDate} at ${appointmentData.newTime}.${appointmentData.reason ? ` Reason: ${appointmentData.reason}` : ''}`
      },
      appointment_reschedule_approved: {
        title: 'Reschedule Approved',
        message: `Your reschedule request has been approved. New appointment date: ${appointmentData.newDate} at ${appointmentData.newTime}.`
      },
      appointment_reschedule_rejected: {
        title: 'Reschedule Request Rejected',
        message: `Your reschedule request has been rejected. Please contact the doctor for more information.`
      }
    };

    const notification = notificationTypes[type];
    if (!notification) {
      throw new Error('Invalid appointment notification type');
    }

    return this.createNotification({
      userId,
      type,
      title: notification.title,
      message: notification.message,
      link: `/appointments/${appointmentData.appointmentId}`,
      metadata: {
        appointmentId: appointmentData.appointmentId,
        doctorId: appointmentData.doctorId
      },
      priority: type === 'appointment_reminder' ? 'high' : 'medium'
    });
  }
}
