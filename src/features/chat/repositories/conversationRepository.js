import { BaseRepository } from '../../../repositories/baseRepository.js';
import Conversation from '../models/conversationModel.js';

export class ConversationRepository extends BaseRepository {
  constructor() {
    super(Conversation);
  }

  getDefaultParticipantPopulate() {
    return [
      {
        path: 'participants',
        // Keep this minimal: only what's needed to label conversations safely in UI.
        select: 'name role profilePicture specialization',
      },
    ];
  }

  /**
   * Override default search fields for conversations.
   * We primarily search by lastMessagePreview.
   */
  getSearchFields() {
    return ['lastMessagePreview'];
  }

  /**
   * Find conversations for a given user with optional search/pagination.
   * @param {string} userId
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async findByUser(userId, options = {}) {
    const query = {
      participants: userId,
      isArchived: false,
    };

    // Ensure default sort by lastMessageAt desc, fallback to createdAt
    const finalOptions = {
      sort: options.sort || '-lastMessageAt -createdAt',
      populate: options.populate || this.getDefaultParticipantPopulate(),
      ...options,
    };

    return this.findAll(query, finalOptions);
  }

  /**
   * Find or create a conversation for the given set of participants.
   * @param {string[]} participantIds
   * @param {Object} metadata
   * @returns {Promise<Object>}
   */
  async findOrCreateConversation(participantIds, metadata = {}) {
    const ids = participantIds.map((id) => id.toString());

    let conversation = await Conversation.findOne({
      participants: {
        $size: ids.length,
        $all: ids,
      },
      isArchived: false,
    }).populate(this.getDefaultParticipantPopulate());

    if (!conversation) {
      conversation = await Conversation.create({
        participants: ids,
        metadata,
      });
      conversation = await conversation.populate(this.getDefaultParticipantPopulate());
    } else if (metadata && Object.keys(metadata).length > 0) {
      // Merge metadata in a minimal way without overriding entire map
      Object.entries(metadata).forEach(([key, value]) => {
        conversation.metadata.set(key, value);
      });
      await conversation.save();
    }

    return conversation;
  }
}

