import { BaseService } from '../../../services/baseService.js';
import { ConversationRepository } from '../repositories/conversationRepository.js';
import { MessageRepository } from '../repositories/messageRepository.js';

/**
 * ChatService
 * Encapsulates domain logic for conversations and messages.
 * Keeps transport-specific details (HTTP, Socket.IO) out for better separation of concerns.
 */
export class ChatService extends BaseService {
  constructor() {
    super(new ConversationRepository());
    this.messageRepository = new MessageRepository();
  }

  /**
   * Get or create a conversation for a set of participants.
   * @param {string[]} participantIds
   * @param {Object} metadata
   */
  async getOrCreateConversation(participantIds, metadata = {}) {
    if (!Array.isArray(participantIds) || participantIds.length < 2) {
      throw new Error('At least two participants are required to create a conversation');
    }

    return this.repository.findOrCreateConversation(participantIds, metadata);
  }

  /**
   * Ensure the user is a participant of the conversation.
   */
  async assertUserInConversation(conversationId, userId) {
    const conversation = await this.getById(conversationId);
    const isParticipant = conversation.participants
      .map((p) => p.toString())
      .includes(userId.toString());

    if (!isParticipant) {
      throw new Error('User is not a participant of this conversation');
    }

    return conversation;
  }

  /**
   * Send a message in a conversation.
   * @param {Object} params
   * @param {string} params.conversationId
   * @param {string} params.senderId
   * @param {string} params.content
   * @param {string} [params.contentType]
   */
  async sendMessage({ conversationId, senderId, content, contentType = 'text', metadata = {} }) {
    if (!content || !content.trim()) {
      throw new Error('Message content is required');
    }

    const conversation = await this.assertUserInConversation(conversationId, senderId);

    const message = await this.messageRepository.create({
      conversationId,
      senderId,
      content: content.trim(),
      contentType,
      status: 'sent',
      sentAt: new Date(),
      metadata,
    });

    // Update conversation with last message info
    const preview = content.trim().slice(0, 200);
    await this.repository.updateById(conversation._id, {
      lastMessageAt: message.sentAt,
      lastMessagePreview: preview,
    });

    return { conversation, message };
  }

  /**
   * Get paginated message history for a conversation.
   * @param {Object} params
   * @param {string} params.conversationId
   * @param {number} [params.page]
   * @param {number} [params.limit]
   */
  async getConversationHistory({ conversationId, page = 1, limit = 20 }) {
    return this.messageRepository.getMessagesForConversation(conversationId, {
      page,
      limit,
      sort: '-sentAt',
    });
  }

  /**
   * Mark all messages in a conversation as read for a user.
   * @param {Object} params
   * @param {string} params.conversationId
   * @param {string} params.userId
   */
  async markConversationRead({ conversationId, userId }) {
    await this.assertUserInConversation(conversationId, userId);
    return this.messageRepository.markConversationAsRead(conversationId, userId);
  }

  /**
   * Get conversations for a user (wrapper around repository method).
   * @param {string} userId
   * @param {Object} options
   */
  async getUserConversations(userId, options = {}) {
    return this.repository.findByUser(userId, options);
  }
}

