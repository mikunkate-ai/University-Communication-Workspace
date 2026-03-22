import Notification from '../models/Notification.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res, next) => {
  const { isRead, limit = 20, page = 1 } = req.query;

  const skip = (page - 1) * limit;
  let query = { userId: req.user._id };

  if (isRead !== undefined) {
    query.isRead = isRead === 'true';
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Notification.countDocuments(query);

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    notifications,
  });
});

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread/count
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    unreadCount: count,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  // Check authorization
  if (notification.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this notification',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    notification,
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res, next) => {
  const result = await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
    modifiedCount: result.modifiedCount,
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  // Check authorization
  if (notification.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this notification',
    });
  }

  await Notification.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
  });
});

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/clear/read
// @access  Private
export const clearReadNotifications = asyncHandler(async (req, res, next) => {
  const result = await Notification.deleteMany({
    userId: req.user._id,
    isRead: true,
  });

  res.status(200).json({
    success: true,
    message: 'Read notifications cleared',
    deletedCount: result.deletedCount,
  });
});
