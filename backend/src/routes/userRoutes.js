import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getLecturers,
  reactivateUser,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All user routes require authentication
router.use(protect);

// Get lecturers (public for students)
router.get('/lecturers', getLecturers);

// Get all users
router.get('/', getAllUsers);

// Get single user
router.get('/:id', getUserById);

// Update user
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

// Reactivate user (admin only)
router.put('/:id/reactivate', authorize('administrator'), reactivateUser);

export default router;
