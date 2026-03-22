import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get all users (lecturers for student view)
// @route   GET /api/users
// @access  Private
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const { role, search } = req.query;

  // Admins can see all users (including inactive); others only see active
  let query = req.user.role === 'administrator' ? {} : { isActive: true };

  if (role) {
    query.role = role;
  }

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query).select('-password').sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
});

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, department, phone, office, profilePicture } = req.body;

  // Check if user is updating their own profile or is admin
  if (req.user._id.toString() !== req.params.id && req.user.role !== 'administrator') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this user',
    });
  }

  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (department) updateData.department = department;
  if (profilePicture) updateData.profilePicture = profilePicture;
  if (phone || office) {
    updateData.contactInfo = {
      phone: phone || '',
      office: office || '',
    };
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user,
  });
});

// @desc    Delete user account
// @route   DELETE /api/users/:id
// @access  Private
export const deleteUser = asyncHandler(async (req, res, next) => {
  // Check if user is deleting their own account or is admin
  if (req.user._id.toString() !== req.params.id && req.user.role !== 'administrator') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this user',
    });
  }

  const { permanent } = req.query;

  if (permanent === 'true') {
    // Permanent deletion — removes user from database entirely
    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'User permanently deleted',
    });
  }

  // Soft delete — deactivate account (default)
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'User account deactivated',
    user,
  });
});

// @desc    Reactivate a user account
// @route   PUT /api/users/:id/reactivate
// @access  Admin only
export const reactivateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({
    success: true,
    message: 'User account reactivated',
    user,
  });
});

// @desc    Get lecturers (for students booking appointments)
// @route   GET /api/users/lecturers
// @access  Private
export const getLecturers = asyncHandler(async (req, res, next) => {
  const lecturers = await User.find({
    role: 'lecturer',
    isActive: true,
  }).select('-password');

  res.status(200).json({
    success: true,
    count: lecturers.length,
    lecturers,
  });
});
