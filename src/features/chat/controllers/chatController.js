import mongoose from 'mongoose';
import { ChatService } from '../services/chatService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';

const chatService = new ChatService();

// @desc    Get or create a conversation with specified participants
// @route   POST /api/chat/conversations
// @access  Private
export const createOrGetConversation = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json(errorResponse('User not authenticated'));
    }

    const { participantIds = [], metadata = {} } = req.body || {};

    // Always include current user as participant
    const currentUserId = req.user._id.toString();
    const uniqueParticipantIds = Array.from(
      new Set(
        [...participantIds.map((id) => id?.toString?.() || String(id)), currentUserId].filter(Boolean)
      )
    );

    if (uniqueParticipantIds.length < 2) {
      return res
        .status(400)
        .json(errorResponse('At least one other participant (besides the current user) is required'));
    }

    const conversation = await chatService.getOrCreateConversation(uniqueParticipantIds, metadata);

    return res
      .status(200)
      .json(successResponse('Conversation created or retrieved successfully', { conversation }));
  } catch (error) {
    console.error('Error creating/getting conversation:', error);
    if (error.message === 'At least two participants are required to create a conversation') {
      return res.status(400).json(errorResponse(error.message));
    }
    return res.status(500).json(errorResponse('Failed to create or retrieve conversation'));
  }
};

// @desc    Get conversations for current user
// @route   GET /api/chat/conversations
// @access  Private
export const getUserConversations = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json(errorResponse('User not authenticated'));
    }

    const { page, limit, sort, search } = req.query;

    const result = await chatService.getUserConversations(req.user._id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sort: sort || '-lastMessageAt -createdAt',
      search: search || undefined,
    });

    const conversations = result.data || result.items || [];
    const paginationInfo = result.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    };

    return res
      .status(200)
      .json(successResponse('Conversations fetched successfully', { items: conversations, pagination: paginationInfo }));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json(errorResponse('Failed to fetch conversations'));
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
export const getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user._id) {
      return res.status(401).json(errorResponse('User not authenticated'));
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(errorResponse('Invalid conversation ID format'));
    }

    // Ensure user is participant
    await chatService.assertUserInConversation(id, req.user._id);

    const { page, limit } = req.query;

    const result = await chatService.getConversationHistory({
      conversationId: id,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    });

    const messages = result.data || result.items || [];
    const paginationInfo = result.pagination || {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0,
    };

    return res
      .status(200)
      .json(successResponse('Messages fetched successfully', { items: messages, pagination: paginationInfo }));
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    if (error.message === 'User is not a participant of this conversation') {
      return res.status(403).json(errorResponse(error.message));
    }
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Conversation not found'));
    }
    return res.status(500).json(errorResponse('Failed to fetch conversation messages'));
  }
};

// @desc    Send a message via HTTP (fallback / for testing)
// @route   POST /api/chat/conversations/:id/messages
// @access  Private
export const sendMessageHttp = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, contentType, metadata } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json(errorResponse('User not authenticated'));
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(errorResponse('Invalid conversation ID format'));
    }

    const { message } = await chatService.sendMessage({
      conversationId: id,
      senderId: req.user._id,
      content,
      contentType,
      metadata,
    });

    return res.status(201).json(successResponse('Message sent successfully', { message }));
  } catch (error) {
    console.error('Error sending message via HTTP:', error);
    if (error.message === 'User is not a participant of this conversation') {
      return res.status(403).json(errorResponse(error.message));
    }
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Conversation not found'));
    }
    return res.status(500).json(errorResponse(error.message || 'Failed to send message'));
  }
};

