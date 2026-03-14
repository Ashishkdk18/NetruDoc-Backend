import { eventBus } from '../events/eventBus.js';

/**
 * Bridges domain-level notification events to Socket.IO.
 * Keeps NotificationService unaware of Socket.IO.
 *
 * @param {import('socket.io').Server} io
 */
export const registerNotificationSocketAdapter = (io) => {
  // Listen for domain events emitted by NotificationService
  eventBus.on('notification:user', ({ userId, notification }) => {
    if (!userId || !notification) return;

    const targetRoom = userId.toString();

    try {
      io.to(targetRoom).emit('notification', {
        // Normalize shape a bit for frontend consumers
        id: notification._id?.toString?.() || notification.id,
        userId: notification.userId?.toString?.() || notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        readAt: notification.readAt,
        link: notification.link,
        metadata: notification.metadata,
        priority: notification.priority,
        expiresAt: notification.expiresAt,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      });
    } catch (error) {
      console.error('Error emitting notification over Socket.IO:', error);
    }
  });
};

