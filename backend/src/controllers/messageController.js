import Message from '../models/Message.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { io } from '../server.js';

// @desc    Send direct message
// @route   POST /api/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res, next) => {
  const { recipientId, content, attachments } = req.body;

  if (!recipientId || !content) {
    return res.status(400).json({
      success: false,
      message: 'Please provide recipient and message content',
    });
  }

  // Verify recipient exists
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    return res.status(404).json({
      success: false,
      message: 'Recipient not found',
    });
  }

  // Enforce domain isolation for non-admins
  if (req.user.role !== 'administrator') {
    if (recipient.department !== req.user.department || recipient.group !== req.user.group) {
      return res.status(403).json({
        success: false,
        message: 'You can only message users in your own department and group',
      });
    }
  }

  const message = await Message.create({
    senderId: req.user._id,
    recipientId,
    messageType: 'direct',
    content,
    attachments: attachments || [],
  });

  await message.populate('senderId', 'firstName lastName profilePicture email');
  await message.populate('recipientId', 'firstName lastName profilePicture email');

  // Emit only to recipient's room
  io.to(`user-${recipientId}`).emit('new_message', message);

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: message,
  });
});

// @desc    Send group message
// @route   POST /api/messages/group/:groupId
// @access  Private
export const sendGroupMessage = asyncHandler(async (req, res, next) => {
  const { content, attachments } = req.body;
  const { groupId } = req.params;

  if (!content) {
    return res.status(400).json({
      success: false,
      message: 'Please provide message content',
    });
  }

  const message = await Message.create({
    senderId: req.user._id,
    groupId,
    messageType: 'group',
    content,
    attachments: attachments || [],
  });

  await message.populate('senderId', 'firstName lastName profilePicture email');

  // Emit to group room
  io.to(`group-${groupId}`).emit('new_group_message', message);

  res.status(201).json({
    success: true,
    message: 'Group message sent successfully',
    data: message,
  });
});

// @desc    Get conversations (list of users with recent messages)
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = asyncHandler(async (req, res, next) => {
  // Find all unique conversations for the user
  const messages = await Message.aggregate([
    {
      $match: {
        deletedAt: null,
        $or: [
          { senderId: req.user._id, messageType: 'direct' },
          { recipientId: req.user._id, messageType: 'direct' },
        ],
      },
    },
    {
      $sort: { timestamp: -1 },
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$senderId', req.user._id] },
            '$recipientId',
            '$senderId',
          ],
        },
        lastMessage: { $first: '$$ROOT' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
  ]);

  res.status(200).json({
    success: true,
    count: messages.length,
    conversations: messages,
  });
});

// @desc    Get messages with specific user
// @route   GET /api/messages/conversation/:userId
// @access  Private
export const getDirectMessages = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { limit = 50, page = 1 } = req.query;

  const skip = (page - 1) * limit;

  const messages = await Message.find({
    messageType: 'direct',
    deletedAt: null,
    $or: [
      { senderId: req.user._id, recipientId: userId },
      { senderId: userId, recipientId: req.user._id },
    ],
  })
    .populate('senderId', 'firstName lastName profilePicture email')
    .populate('recipientId', 'firstName lastName profilePicture email')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Mark messages as read (exclude soft-deleted)
  await Message.updateMany(
    {
      recipientId: req.user._id,
      senderId: userId,
      isRead: false,
      deletedAt: null,
    },
    { isRead: true, readAt: new Date() }
  );

  res.status(200).json({
    success: true,
    count: messages.length,
    page: parseInt(page),
    messages: messages.reverse(),
  });
});

// @desc    Get group messages
// @route   GET /api/messages/group/:groupId
// @access  Private
export const getGroupMessages = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;
  const { limit = 50, page = 1 } = req.query;

  const skip = (page - 1) * limit;

  const messages = await Message.find({
    groupId,
    messageType: 'group',
  })
    .populate('senderId', 'firstName lastName profilePicture email')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: messages.length,
    page: parseInt(page),
    messages: messages.reverse(),
  });
});

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
export const markMessageAsRead = asyncHandler(async (req, res, next) => {
  const message = await Message.findByIdAndUpdate(
    req.params.id,
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Message marked as read',
    data: message,
  });
});

// @desc    Edit message
// @route   PUT /api/messages/:id
// @access  Private
export const editMessage = asyncHandler(async (req, res, next) => {
  const { content } = req.body;

  const message = await Message.findById(req.params.id);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found',
    });
  }

  // Only sender can edit
  if (message.senderId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to edit this message',
    });
  }

  message.content = content;
  message.editedAt = new Date();
  await message.save();

  await message.populate('senderId', 'firstName lastName profilePicture email');

  // Emit edit event
  io.emit('message_edited', message);

  res.status(200).json({
    success: true,
    message: 'Message updated successfully',
    data: message,
  });
});

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
export const deleteMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found',
    });
  }

  // Sender OR recipient can delete (needed for clearing full conversations)
  const isParticipant =
    message.senderId.toString() === req.user._id.toString() ||
    message.recipientId?.toString() === req.user._id.toString();
  if (!isParticipant) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this message',
    });
  }

  message.deletedAt = new Date();
  await message.save();

  // Emit delete event
  io.emit('message_deleted', { messageId: req.params.id });

  res.status(200).json({
    success: true,
    message: 'Message deleted successfully',
  });
});

// @desc    Get unread message count
// @route   GET /api/messages/unread/count
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Message.countDocuments({
    recipientId: req.user._id,
    isRead: false,
    messageType: 'direct',
    deletedAt: null,
  });

  res.status(200).json({
    success: true,
    unreadCount: count,
  });
});
