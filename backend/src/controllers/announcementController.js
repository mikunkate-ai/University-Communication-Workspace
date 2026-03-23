import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import ProjectGroup from '../models/ProjectGroup.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { io } from '../server.js';
import Notification from '../models/Notification.js';

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (Lecturers/Admins)
export const createAnnouncement = asyncHandler(async (req, res, next) => {
  const { title, content, category, targetAudience, targetGroupId, relatedCourse, attachments, expiryDate } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      message: 'Please provide title and content',
    });
  }

  // Only lecturers and admins can create announcements
  if (!['lecturer', 'administrator'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Only lecturers and administrators can create announcements',
    });
  }

  // Enforce lecturers can only target students
  let finalTargetAudience = targetAudience || 'all';
  if (req.user.role === 'lecturer') {
    if (finalTargetAudience === 'all' || finalTargetAudience === 'lecturers') {
      finalTargetAudience = 'students';
    }
  }

  const announcement = await Announcement.create({
    authorId: req.user._id,
    title,
    content,
    category: category || 'general',
    targetAudience: finalTargetAudience,
    targetGroupId: targetGroupId || null,
    department: req.user.department,
    group: req.user.group,
    relatedCourse: relatedCourse || '',
    attachments: attachments || [],
    expiryDate: expiryDate ? new Date(expiryDate) : null,
  });

  await announcement.populate('authorId', 'firstName lastName email');

  // Create notifications based on target audience
  let targetUsers = [];

  if (finalTargetAudience === 'all' || finalTargetAudience === 'students') {
    const students = await User.find({ role: 'student', isActive: true });
    targetUsers = students.map(u => u._id);
  } else if (finalTargetAudience === 'lecturers') {
    targetUsers = []; // lecturers do not receive announcement notifications
  } else if (finalTargetAudience === 'specific_group' && targetGroupId) {
    const group = await ProjectGroup.findById(targetGroupId);
    targetUsers = group ? group.members : [];
  }

  if (targetUsers.length > 0) {
    const notifications = targetUsers.map(userId => ({
      userId,
      type: 'announcement',
      title: `New Announcement: ${title}`,
      message: content.substring(0, 100),
      referenceId: announcement._id,
      referenceType: 'Announcement',
    }));
    await Notification.insertMany(notifications);
  }

  // Emit real-time notification
  io.emit('new_announcement', announcement);

  res.status(201).json({
    success: true,
    message: 'Announcement created successfully',
    announcement,
  });
});

// @desc    Get announcements
// @route   GET /api/announcements
// @access  Private
export const getAnnouncements = asyncHandler(async (req, res, next) => {
  const { category, search } = req.query;
  let query = { isActive: true };

  // Enforce domain isolation for non-admins
  if (req.user.role !== 'administrator') {
    query.department = req.user.department;
    query.group = req.user.group;
  }

  // Build audience filter based on user role
  const audienceFilters = [
    { targetAudience: 'all' },
    { targetAudience: req.user.role === 'student' ? 'students' : 'lecturers' },
  ];

  // If student, also include announcements for their project groups
  if (req.user.role === 'student') {
    const groups = await ProjectGroup.find({ members: req.user._id });
    const groupIds = groups.map(g => g._id);
    if (groupIds.length > 0) {
      audienceFilters.push({
        targetAudience: 'specific_group',
        targetGroupId: { $in: groupIds },
      });
    }
  }

  query.$or = audienceFilters;

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$or = [
      ...query.$or,
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }

  const announcements = await Announcement.find(query)
    .populate('authorId', 'firstName lastName email profilePicture')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: announcements.length,
    announcements,
  });
});

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private
export const getAnnouncementById = asyncHandler(async (req, res, next) => {
  const announcement = await Announcement.findById(req.params.id).populate(
    'authorId',
    'firstName lastName email profilePicture'
  );

  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found',
    });
  }

  res.status(200).json({
    success: true,
    announcement,
  });
});

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (Author/Admin)
export const updateAnnouncement = asyncHandler(async (req, res, next) => {
  const { title, content, category, targetAudience, expiryDate } = req.body;

  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found',
    });
  }

  // Only author or admin can update
  if (
    req.user._id.toString() !== announcement.authorId.toString() &&
    req.user.role !== 'administrator'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this announcement',
    });
  }

  if (title) announcement.title = title;
  if (content) announcement.content = content;
  if (category) announcement.category = category;
  if (targetAudience) announcement.targetAudience = targetAudience;
  if (expiryDate) announcement.expiryDate = new Date(expiryDate);

  await announcement.save();

  await announcement.populate('authorId', 'firstName lastName email');

  res.status(200).json({
    success: true,
    message: 'Announcement updated successfully',
    announcement,
  });
});

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Author/Admin)
export const deleteAnnouncement = asyncHandler(async (req, res, next) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found',
    });
  }

  // Only author or admin can delete
  if (
    req.user._id.toString() !== announcement.authorId.toString() &&
    req.user.role !== 'administrator'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this announcement',
    });
  }

  announcement.isActive = false;
  await announcement.save();

  res.status(200).json({
    success: true,
    message: 'Announcement deleted successfully',
  });
});
