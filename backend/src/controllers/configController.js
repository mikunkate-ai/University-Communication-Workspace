import SystemConfig from '../models/SystemConfig.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Helper to get or create config automatically
const getConfigDoc = async () => {
  let config = await SystemConfig.findOne();
  if (!config) {
    config = await SystemConfig.create({
      departments: ['Software Engineering', 'Computer Science'],
      groups: ['Group A', 'Group B', 'Group C', 'Group D', 'Group E'],
    });
  }
  return config;
};

// @desc    Get system config
// @route   GET /api/config
// @access  Public
export const getConfig = asyncHandler(async (req, res, next) => {
  const config = await getConfigDoc();
  res.status(200).json({
    success: true,
    config,
  });
});

// @desc    Add item to config
// @route   POST /api/config/:type
// @access  Private (Admin)
export const addConfigItem = asyncHandler(async (req, res, next) => {
  const { type } = req.params;
  const { item } = req.body;

  if (!['departments', 'groups'].includes(type) || !item) {
    return res.status(400).json({
      success: false,
      message: 'Invalid config type or missing item',
    });
  }

  const config = await getConfigDoc();
  
  if (config[type].includes(item)) {
    return res.status(400).json({
      success: false,
      message: 'Item already exists',
    });
  }
  
  config[type].push(item);
  await config.save();
  
  res.status(200).json({
    success: true,
    message: 'Added successfully',
    config,
  });
});

// @desc    Remove item from config
// @route   DELETE /api/config/:type/:item
// @access  Private (Admin)
export const removeConfigItem = asyncHandler(async (req, res, next) => {
  const { type, item } = req.params;

  if (!['departments', 'groups'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid config type',
    });
  }

  const config = await getConfigDoc();
  config[type] = config[type].filter((i) => i !== item);
  await config.save();

  res.status(200).json({
    success: true,
    message: 'Removed successfully',
    config,
  });
});
