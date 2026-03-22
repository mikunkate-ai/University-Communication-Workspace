import express from 'express';
import {
  sendMessage,
  sendGroupMessage,
  getConversations,
  getDirectMessages,
  getGroupMessages,
  markMessageAsRead,
  editMessage,
  deleteMessage,
  getUnreadCount,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Send direct message
router.post('/', sendMessage);

// Send group message
router.post('/group/:groupId', sendGroupMessage);

// Get conversations list
router.get('/conversations', getConversations);

// Get unread count
router.get('/unread/count', getUnreadCount);

// Get direct messages with specific user
router.get('/conversation/:userId', getDirectMessages);

// Get group messages
router.get('/group/:groupId', getGroupMessages);

// Mark message as read
router.put('/:id/read', markMessageAsRead);

// Edit message
router.put('/:id', editMessage);

// Delete message
router.delete('/:id', deleteMessage);

export default router;
