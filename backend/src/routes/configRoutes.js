import express from 'express';
import { 
  getConfig, 
  addConfigItem, 
  removeConfigItem 
} from '../controllers/configController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public route for fetching the dropdown arrays on the Registration page
router.get('/', getConfig);

// Protected Admin routes for Adding and Removing
router.post('/:type', protect, authorize('administrator'), addConfigItem);
router.delete('/:type/:item', protect, authorize('administrator'), removeConfigItem);

export default router;
