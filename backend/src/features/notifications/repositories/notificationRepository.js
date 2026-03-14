import { BaseRepository } from '../../../repositories/baseRepository.js';
import Notification from '../models/notificationModel.js';

/**
 * Notification Repository
 * Handles all database operations for notifications
 */
export class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  /**
   * Find notifications by user
   * @param {String} userId - User ID
   * @param {Object} options - Pagination and filtering options
   * @returns {Promise<Object>}
   */
  async findByUser(userId, options = {}) {
    const query = { userId };
    
    if (options.unreadOnly) {
      query.isRead = false;
    }

    return this.findAll(query, options);
  }

  /**
   * Get unread count for user
   * @param {String} userId - User ID
   * @returns {Promise<Number>}
   */
  async getUnreadCount(userId) {
    return this.count({ userId, isRead: false });
  }

  /**
   * Mark notification as read
   * @param {String} notificationId - Notification ID
   * @returns {Promise<Object>}
   */
  async markAsRead(notificationId) {
    return this.updateById(notificationId, {
      isRead: true,
      readAt: new Date()
    });
  }

  /**
   * Mark all notifications as read for user
   * @param {String} userId - User ID
   * @returns {Promise<Object>}
   */
  async markAllAsRead(userId) {
    return this.model.updateMany(
      { userId, isRead: false },
      {
        isRead: true,
        readAt: new Date()
      }
    );
  }

  /**
   * Delete read notifications older than specified days
   * @param {Number} days - Number of days
   * @returns {Promise<Object>}
   */
  async deleteOldReadNotifications(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.model.deleteMany({
      isRead: true,
      readAt: { $lt: cutoffDate }
    });
  }

  /**
   * Find notifications by type
   * @param {String} userId - User ID
   * @param {String} type - Notification type
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async findByType(userId, type, options = {}) {
    return this.findAll({ userId, type }, options);
  }
}
