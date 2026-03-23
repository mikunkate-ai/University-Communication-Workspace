import ProjectGroup from '../models/ProjectGroup.js';
import ProjectSubmission from '../models/ProjectSubmission.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { io } from '../server.js';

// @desc    Create project group
// @route   POST /api/projects
// @access  Private (Lecturers)
export const createProject = asyncHandler(async (req, res, next) => {
  const { groupName, projectTitle, description, members, deadline } = req.body;

  if (!groupName || !projectTitle) {
    return res.status(400).json({
      success: false,
      message: 'Please provide group name and project title',
    });
  }

  // Only lecturers can create projects
  if (req.user.role !== 'lecturer') {
    return res.status(403).json({
      success: false,
      message: 'Only lecturers can create projects',
    });
  }

  // Verify all members are in the same domain
  if (members && members.length > 0) {
    const validMembers = await User.countDocuments({
      _id: { $in: members },
      department: req.user.department,
      group: req.user.group,
      role: 'student'
    });
    if (validMembers !== members.length) {
      return res.status(403).json({
        success: false,
        message: 'All members must be students in your department and group',
      });
    }
  }

  const project = await ProjectGroup.create({
    groupName,
    projectTitle,
    description: description || '',
    supervisorId: req.user._id,
    department: req.user.department,
    group: req.user.group,
    members: members || [],
    deadline: deadline || null,
  });

  await project.populate('supervisorId', 'firstName lastName email');
  await project.populate('members', 'firstName lastName email');

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    project,
  });
});

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
export const getProjects = asyncHandler(async (req, res, next) => {
  let query = { status: 'active' };

  if (req.user.role !== 'administrator') {
    query.department = req.user.department;
    query.group = req.user.group;
  }

  if (req.user.role === 'lecturer') {
    query.supervisorId = req.user._id;
  } else if (req.user.role === 'student') {
    query.members = req.user._id;
  }

  const projects = await ProjectGroup.find(query)
    .populate('supervisorId', 'firstName lastName email profilePicture')
    .populate('members', 'firstName lastName email profilePicture')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: projects.length,
    projects,
  });
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = asyncHandler(async (req, res, next) => {
  const project = await ProjectGroup.findById(req.params.id)
    .populate('supervisorId', 'firstName lastName email profilePicture')
    .populate('members', 'firstName lastName email profilePicture');

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  // Check authorization
  const isMember = project.members.some(m => m._id.toString() === req.user._id.toString());
  if (req.user._id.toString() !== project.supervisorId._id.toString() && !isMember && req.user.role !== 'administrator') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this project',
    });
  }

  res.status(200).json({
    success: true,
    project,
  });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Supervisor)
export const updateProject = asyncHandler(async (req, res, next) => {
  const { groupName, projectTitle, description, members, status, deadline } = req.body;

  const project = await ProjectGroup.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  // Only supervisor can update
  if (req.user._id.toString() !== project.supervisorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only the supervisor can update this project',
    });
  }

  if (groupName) project.groupName = groupName;
  if (projectTitle) project.projectTitle = projectTitle;
  if (description) project.description = description;
  if (members) project.members = members;
  if (status) project.status = status;
  if (deadline) project.deadline = new Date(deadline);

  await project.save();

  await project.populate('supervisorId', 'firstName lastName email');
  await project.populate('members', 'firstName lastName email');

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    project,
  });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Supervisor)
export const deleteProject = asyncHandler(async (req, res, next) => {
  const project = await ProjectGroup.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  // Only supervisor can delete
  if (req.user._id.toString() !== project.supervisorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only the supervisor can delete this project',
    });
  }

  project.status = 'archived';
  await project.save();

  res.status(200).json({
    success: true,
    message: 'Project archived successfully',
  });
});

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (Supervisor)
export const addProjectMember = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  const project = await ProjectGroup.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  // Only supervisor can add members
  if (req.user._id.toString() !== project.supervisorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only the supervisor can add members',
    });
  }

  // Verify user exists and is a student
  const user = await User.findById(userId);
  if (!user || user.role !== 'student') {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  // Enforce domain isolation
  if (req.user.role !== 'administrator') {
    if (user.department !== req.user.department || user.group !== req.user.group) {
      return res.status(403).json({
        success: false,
        message: 'Student must be in your department and group',
      });
    }
  }

  // Check if already a member
  if (project.members.includes(userId)) {
    return res.status(400).json({
      success: false,
      message: 'User is already a member of this project',
    });
  }

  project.members.push(userId);
  await project.save();

  await project.populate('supervisorId', 'firstName lastName email');
  await project.populate('members', 'firstName lastName email');

  res.status(200).json({
    success: true,
    message: 'Member added successfully',
    project,
  });
});

// @desc    Submit project work
// @route   POST /api/projects/:id/submissions
// @access  Private (Students)
export const submitProject = asyncHandler(async (req, res, next) => {
  const { title, description, fileUrl, fileName, fileSize } = req.body;

  if (!title || !fileUrl) {
    return res.status(400).json({
      success: false,
      message: 'Please provide title and file',
    });
  }

  const project = await ProjectGroup.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  // Check if user is project member
  const isMember = project.members.some(m => m.toString() === req.user._id.toString());
  if (!isMember) {
    return res.status(403).json({
      success: false,
      message: 'Only project members can submit work',
    });
  }

  // Get latest version
  const lastSubmission = await ProjectSubmission.findOne({ projectGroupId: req.params.id })
    .sort({ version: -1 });

  const version = lastSubmission ? lastSubmission.version + 1 : 1;

  const submission = await ProjectSubmission.create({
    projectGroupId: req.params.id,
    submittedBy: req.user._id,
    title,
    description: description || '',
    fileUrl,
    fileName,
    fileSize,
    version,
  });

  await submission.populate('submittedBy', 'firstName lastName email');

  // Emit notification
  io.emit('project_submission', submission);

  res.status(201).json({
    success: true,
    message: 'Project submitted successfully',
    submission,
  });
});

// @desc    Get project submissions
// @route   GET /api/projects/:id/submissions
// @access  Private
export const getProjectSubmissions = asyncHandler(async (req, res, next) => {
  const submissions = await ProjectSubmission.find({ projectGroupId: req.params.id })
    .populate('submittedBy', 'firstName lastName email profilePicture')
    .populate('projectGroupId', 'groupName projectTitle')
    .sort({ submittedAt: -1 });

  res.status(200).json({
    success: true,
    count: submissions.length,
    submissions,
  });
});

// @desc    Add feedback to submission
// @route   POST /api/projects/submissions/:id/feedback
// @access  Private (Supervisor)
export const addSubmissionFeedback = asyncHandler(async (req, res, next) => {
  const { comment, rating } = req.body;

  if (!comment) {
    return res.status(400).json({
      success: false,
      message: 'Please provide feedback comment',
    });
  }

  const submission = await ProjectSubmission.findById(req.params.id);

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: 'Submission not found',
    });
  }

  // Verify user is the supervisor
  const project = await ProjectGroup.findById(submission.projectGroupId);
  if (req.user._id.toString() !== project.supervisorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only the supervisor can add feedback',
    });
  }

  submission.feedback.push({
    feedbackBy: req.user._id,
    comment,
    rating: rating || null,
  });

  submission.status = 'reviewed';
  await submission.save();

  await submission.populate('submittedBy', 'firstName lastName email');

  res.status(200).json({
    success: true,
    message: 'Feedback added successfully',
    submission,
  });
});
