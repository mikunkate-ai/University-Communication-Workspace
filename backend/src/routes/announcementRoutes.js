import express from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create announcement
router.post('/', createAnnouncement);

// Get announcements
router.get('/', getAnnouncements);

// Get single announcement
router.get('/:id', getAnnouncementById);

// Update announcement
router.put('/:id', updateAnnouncement);

// Delete announcement
router.delete('/:id', deleteAnnouncement);

export default router;
