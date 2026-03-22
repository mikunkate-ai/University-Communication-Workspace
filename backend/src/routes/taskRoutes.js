import express from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create task
router.post('/', createTask);

// Get all tasks
router.get('/', getTasks);

// Get single task
router.get('/:id', getTaskById);

// Update task
router.put('/:id', updateTask);

// Update task status
router.put('/:id/status', updateTaskStatus);

// Delete task
router.delete('/:id', deleteTask);

export default router;
