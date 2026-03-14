import express from 'express';
import { protect } from '../../middleware/auth.js';
import {
  createOrGetConversation,
  getUserConversations,
  getConversationMessages,
  sendMessageHttp,
} from './controllers/chatController.js';

const router = express.Router();

// All chat routes require authentication
router.use(protect);

// Conversations
router.get('/conversations', getUserConversations);
router.post('/conversations', createOrGetConversation);

// Messages
router.get('/conversations/:id/messages', getConversationMessages);
router.post('/conversations/:id/messages', sendMessageHttp);

export default router;

