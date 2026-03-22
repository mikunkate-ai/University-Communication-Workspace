import express from 'express';
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  updateAppointment,
  deleteAppointment,
  getLecturerAvailability,
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create appointment (students only)
router.post('/', createAppointment);

// Get all appointments for user
router.get('/', getAppointments);

// Get lecturer availability
router.get('/lecturer/:lecturerId/availability', getLecturerAvailability);

// Get single appointment
router.get('/:id', getAppointmentById);

// Update appointment details
router.put('/:id', updateAppointment);

// Update appointment status (lecturer confirms/declines)
router.put('/:id/status', updateAppointmentStatus);

// Cancel appointment
router.delete('/:id', deleteAppointment);

export default router;
