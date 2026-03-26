import { ChatService } from '../features/chat/services/chatService.js';
import { NotificationService } from '../features/notifications/services/notificationService.js';

const chatService = new ChatService();
const notificationService = new NotificationService();

/**
 * Chat-related Socket.IO handlers.
 * Handles real-time messaging and conversation room management.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export const registerChatHandlers = (io, socket) => {
  /**
   * Join a conversation room after verifying membership.
   */
  socket.on('chat:joinConversation', async ({ conversationId }) => {
    try {
      const userId = socket.data?.userId;
      if (!userId) {
        return socket.emit('chat:error', { conversationId, message: 'User not authenticated in socket context' });
      }

      await chatService.assertUserInConversation(conversationId, userId);
      const roomName = `conversation:${conversationId}`;
      socket.join(roomName);

      socket.emit('chat:joinedConversation', { conversationId });
    } catch (error) {
      console.error('Error in chat:joinConversation:', error);
      socket.emit('chat:error', {
        conversationId,
        message: error.message || 'Failed to join conversation',
      });
    }
  });

  /**
   * Send a message within a conversation.
   */
  socket.on('chat:sendMessage', async ({ conversationId, content, contentType, metadata }) => {
    try {
      const userId = socket.data?.userId;
      if (!userId) {
        return socket.emit('chat:error', { conversationId, message: 'User not authenticated in socket context' });
      }

      const { conversation, message } = await chatService.sendMessage({
        conversationId,
        senderId: userId,
        content,
        contentType,
        metadata,
      });

      const normalizedMessage = {
        ...message.toObject?.() ?? message,
        id: message._id?.toString?.() || message.id,
        conversationId: message.conversationId?.toString?.() || conversationId,
        senderId: message.senderId?.toString?.() || userId,
      };

      const payload = {
        conversationId: conversation._id?.toString?.() || conversationId,
        message: normalizedMessage,
      };

      const roomName = `conversation:${payload.conversationId}`;

      // Emit to all users currently viewing this conversation
      io.to(roomName).emit('chat:messageCreated', payload);

      // Also emit to each participant's personal room for global indicators
      const participants = (conversation.participants || []).map((p) => p.toString());
      participants.forEach((participantId) => {
        io.to(participantId).emit('chat:messageCreated', payload);
      });

      // Create a notification for all other participants
      await Promise.all(
        participants
          .filter((participantId) => participantId !== userId.toString())
          .map((receiverId) =>
            notificationService.createNotification({
              userId: receiverId,
              type: 'message',
              title: 'New message',
              message: normalizedMessage.content,
              link: `/chat?conversationId=${payload.conversationId}`,
              metadata: {
                conversationId: payload.conversationId,
                senderId: normalizedMessage.senderId,
              },
              priority: 'medium',
            })
          )
      );
    } catch (error) {
      console.error('Error in chat:sendMessage:', error);
      socket.emit('chat:error', {
        conversationId,
        message: error.message || 'Failed to send message',
      });
    }
  });

  /**
   * Mark all messages in a conversation as read for the current user.
   */
  socket.on('chat:markRead', async ({ conversationId }) => {
    try {
      const userId = socket.data?.userId;
      if (!userId) {
        return socket.emit('chat:error', { conversationId, message: 'User not authenticated in socket context' });
      }

      const result = await chatService.markConversationRead({ conversationId, userId });

      const payload = {
        conversationId,
        userId: userId.toString(),
        modifiedCount: result.modified,
      };

      const roomName = `conversation:${conversationId}`;
      io.to(roomName).emit('chat:conversationRead', payload);
      io.to(userId.toString()).emit('chat:conversationRead', payload);
    } catch (error) {
      console.error('Error in chat:markRead:', error);
      socket.emit('chat:error', {
        conversationId,
        message: error.message || 'Failed to mark conversation as read',
      });
    }
  });
};

