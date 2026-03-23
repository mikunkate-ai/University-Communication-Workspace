import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/errorHandler.js';

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
  const { email, password, role, firstName, lastName, department, group, matricNumber, lecturerId } = req.body;

  // Validation
  if (!email || !password || !firstName || !lastName || !department || !group) {
    throw new AppError('Please provide all required fields', 400);
  }

  // Check if user exists
  let user = await User.findOne({ email });
  if (user) {
    throw new AppError('User already exists with that email', 400);
  }

  // Create user
  user = await User.create({
    email,
    password,
    role: role || 'student',
    firstName,
    lastName,
    department,
    group,
    matricNumber: role === 'student' ? (matricNumber || null) : null,
    lecturerId: role === 'lecturer' ? (lecturerId || null) : null,
  });

  // Create token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: user.toJSON(),
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Check for user
  let user;
  try {
    user = await User.findOne({ email }).select('+password');
  } catch (err) {
    console.error('Database error during login:', err);
    throw new AppError('An error occurred while processing your login', 500);
  }

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if password matches
  let isMatch;
  try {
    isMatch = await user.comparePassword(password);
  } catch (err) {
    console.error('Password comparison error:', err);
    throw new AppError('An error occurred while verifying your password', 500);
  }

  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  // Create token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: user.toJSON(),
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.userId);

  res.status(200).json({
    success: true,
    user: user.toJSON(),
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res, next) => {
  // Token invalidation is handled on client side by removing the token
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});
