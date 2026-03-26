import { BaseRepository } from '../../../repositories/baseRepository.js';
import Message from '../models/messageModel.js';

export class MessageRepository extends BaseRepository {
  constructor() {
    super(Message);
  }

  /**
   * Get messages for a conversation with pagination.
   * @param {string} conversationId
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async getMessagesForConversation(conversationId, options = {}) {
    const query = { conversationId };
    const finalOptions = {
      sort: options.sort || '-sentAt',
      ...options,
    };
    return this.findAll(query, finalOptions);
  }

  /**
   * Mark all messages in a conversation as read for a given user.
   * For 1:1 chats this is sufficient; for group chats, a per-user read model would be needed.
   * @param {string} conversationId
   * @param {string} userId
   * @returns {Promise<{ matched: number, modified: number }>}
   */
  async markConversationAsRead(conversationId, userId) {
    const result = await this.model.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        status: { $ne: 'read' },
      },
      {
        $set: {
          status: 'read',
          readAt: new Date(),
        },
      }
    );

    return {
      matched: result.matchedCount ?? result.n ?? 0,
      modified: result.modifiedCount ?? result.nModified ?? 0,
    };
  }
}

