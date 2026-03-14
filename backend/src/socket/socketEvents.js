import { registerConsultationHandlers } from './consultationSocketHandlers.js';
import { registerChatHandlers } from './chatSocketHandlers.js';
import { registerNotificationSocketAdapter } from './notificationSocketAdapter.js';

/**
 * Register all Socket.IO event handlers and cross-cutting adapters.
 *
 * @param {import('socket.io').Server} io
 */
export const registerSocketHandlers = (io) => {
  // Wire domain-level notification events to Socket.IO
  registerNotificationSocketAdapter(io);

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join user-specific room (socket.userId set by socketAuth middleware)
    if (socket.userId) {
      socket.join(socket.userId);
      console.log(`User ${socket.userId} joined personal room`);
    }

    // Join user-specific room and store userId on socket context (backward compatibility)
    socket.on('join', (userId) => {
      if (!userId) return;
      socket.join(userId);
      socket.data.userId = userId.toString();
      console.log(`User ${userId} joined personal room`);
    });

    // Feature-specific handlers
    registerChatHandlers(io, socket);
    registerConsultationHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

