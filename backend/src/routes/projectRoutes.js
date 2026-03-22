import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  submitProject,
  getProjectSubmissions,
  addSubmissionFeedback,
} from '../controllers/projectController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create project (lecturers only)
router.post('/', createProject);

// Get all projects
router.get('/', getProjects);

// Get single project
router.get('/:id', getProjectById);

// Update project
router.put('/:id', updateProject);

// Delete project
router.delete('/:id', deleteProject);

// Add member to project
router.post('/:id/members', addProjectMember);

// Submit project work
router.post('/:id/submissions', submitProject);

// Get project submissions
router.get('/:id/submissions', getProjectSubmissions);

// Add feedback to submission
router.post('/submissions/:id/feedback', addSubmissionFeedback);

export default router;
