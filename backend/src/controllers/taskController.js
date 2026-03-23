import Task from '../models/Task.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { io } from '../server.js';
import Notification from '../models/Notification.js';

// @desc    Create task
// @route   POST /api/tasks
// @access  Private (Lecturers)
export const createTask = asyncHandler(async (req, res, next) => {
  const { title, description, deadline, priority, assignedTo, relatedCourse, relatedProject, attachments } = req.body;

  if (!title || !deadline) {
    return res.status(400).json({
      success: false,
      message: 'Please provide title and deadline',
    });
  }

  // Only lecturers can create tasks
  if (req.user.role !== 'lecturer') {
    return res.status(403).json({
      success: false,
      message: 'Only lecturers can create tasks',
    });
  }

  // Normalize assignedTo: frontend may send a single string ID or an array
  const assignedToArr = Array.isArray(assignedTo)
    ? assignedTo
    : assignedTo ? [assignedTo] : [];

  // Verify all assigned users are in the same domain
  if (assignedToArr.length > 0 && req.user.role !== 'administrator') {
    const validAssignees = await User.countDocuments({
      _id: { $in: assignedToArr },
      department: req.user.department,
      group: req.user.group
    });
    if (validAssignees !== assignedToArr.length) {
      return res.status(403).json({
        success: false,
        message: 'All assigned users must be in your department and group',
      });
    }
  }

  const task = await Task.create({
    createdBy: req.user._id,
    department: req.user.department,
    group: req.user.group,
    title,
    description: description || '',
    deadline: new Date(deadline),
    priority: priority || 'medium',
    assignedTo: assignedToArr,
    relatedCourse: relatedCourse || '',
    relatedProject: relatedProject || null,
    attachments: attachments || [],
  });

  await task.populate('createdBy', 'firstName lastName email');
  await task.populate('assignedTo', 'firstName lastName email');

  // Create notifications for assigned users
  if (assignedToArr.length > 0) {
    const notifications = assignedToArr.map(userId => ({
      userId,
      type: 'task',
      title: `New Task: ${title}`,
      message: `${req.user.firstName} ${req.user.lastName} assigned you a task`,
      referenceId: task._id,
      referenceType: 'Task',
    }));
    await Notification.insertMany(notifications);
  }

  // Emit real-time notification
  io.emit('task_created', { task, assignedTo: assignedToArr });

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    task,
  });
});

// @desc    Get all tasks for user
// @route   GET /api/tasks
// @access  Private
export const getTasks = asyncHandler(async (req, res, next) => {
  const { status, priority } = req.query;
  let query = {};

  if (req.user.role !== 'administrator') {
    query.department = req.user.department;
    query.group = req.user.group;
  }

  if (req.user.role === 'lecturer') {
    query.createdBy = req.user._id;
  } else if (req.user.role === 'student') {
    query.assignedTo = req.user._id;
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;

  const tasks = await Task.find(query)
    .populate('createdBy', 'firstName lastName email profilePicture')
    .populate('assignedTo', 'firstName lastName email profilePicture')
    .sort({ deadline: 1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks,
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email profilePicture')
    .populate('assignedTo', 'firstName lastName email profilePicture');

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  // Check authorization
  const isAssigned = task.assignedTo.some(u => u._id.toString() === req.user._id.toString());
  if (req.user._id.toString() !== task.createdBy._id.toString() && !isAssigned && req.user.role !== 'administrator') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this task',
    });
  }

  res.status(200).json({
    success: true,
    task,
  });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Creator/Lecturer)
export const updateTask = asyncHandler(async (req, res, next) => {
  const { title, description, deadline, priority, assignedTo, status, relatedCourse } = req.body;

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  // Only creator can update
  if (req.user._id.toString() !== task.createdBy.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only the task creator can update this task',
    });
  }

  if (title) task.title = title;
  if (description) task.description = description;
  if (deadline) task.deadline = new Date(deadline);
  if (priority) task.priority = priority;
  if (assignedTo) task.assignedTo = assignedTo;
  if (status) {
    task.status = status;
    if (status === 'completed') task.completedAt = new Date();
  }
  if (relatedCourse) task.relatedCourse = relatedCourse;

  await task.save();

  await task.populate('createdBy', 'firstName lastName email');
  await task.populate('assignedTo', 'firstName lastName email');

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    task,
  });
});

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private (Assigned User)
export const updateTaskStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status || !['not_started', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status provided',
    });
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  // Check if user is assigned to task
  const isAssigned = task.assignedTo.some(u => u.toString() === req.user._id.toString());
  if (!isAssigned && req.user.role !== 'administrator') {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to this task',
    });
  }

  task.status = status;
  if (status === 'completed') task.completedAt = new Date();

  await task.save();

  await task.populate('createdBy', 'firstName lastName email');
  await task.populate('assignedTo', 'firstName lastName email');

  // Emit status update
  io.emit('task_status_updated', task);

  res.status(200).json({
    success: true,
    message: 'Task status updated successfully',
    task,
  });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Creator)
export const deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  // Only creator can delete
  if (req.user._id.toString() !== task.createdBy.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only the task creator can delete this task',
    });
  }

  await Task.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
  });
});
