import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { io } from '../server.js';

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private (Students)
export const createAppointment = asyncHandler(async (req, res, next) => {
  const { lecturerId, studentId, title, description, scheduledDate, scheduledTime, duration, location } = req.body;

  // Validation
  if (!title || !scheduledDate || !scheduledTime) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  let appointmentData = {
    title,
    description: description || '',
    scheduledDate: new Date(scheduledDate),
    scheduledTime,
    duration: duration || 30,
    location: location || 'Online',
    bookedBy: req.user._id,
  };

  if (req.user.role === 'student') {
    // Student books with a lecturer — status pending
    if (!lecturerId) {
      return res.status(400).json({ success: false, message: 'Please select a lecturer' });
    }
    const lecturer = await User.findById(lecturerId);
    if (!lecturer || lecturer.role !== 'lecturer') {
      return res.status(404).json({ success: false, message: 'Lecturer not found' });
    }
    if (req.user.role !== 'administrator' && (lecturer.department !== req.user.department || lecturer.group !== req.user.group)) {
      return res.status(403).json({ success: false, message: 'You can only book appointments with lecturers in your department and group' });
    }
    appointmentData.studentId = req.user._id;
    appointmentData.lecturerId = lecturerId;
    appointmentData.status = 'pending';
  } else if (req.user.role === 'lecturer') {
    // Lecturer books with a student — auto-confirmed
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Please select a student' });
    }
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    if (req.user.role !== 'administrator' && (student.department !== req.user.department || student.group !== req.user.group)) {
      return res.status(403).json({ success: false, message: 'You can only book appointments with students in your department and group' });
    }
    appointmentData.lecturerId = req.user._id;
    appointmentData.studentId = studentId;
    appointmentData.status = 'confirmed';
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized to create appointments' });
  }

  const appointment = await Appointment.create(appointmentData);

  // Populate info before sending response
  await appointment.populate('lecturerId', 'firstName lastName email');
  await appointment.populate('studentId', 'firstName lastName email');
  await appointment.populate('bookedBy', 'firstName lastName');

  // Notify the other party in real time
  const notifyUserId = req.user.role === 'student'
    ? appointment.lecturerId._id
    : appointment.studentId._id;
  io.to(`user-${notifyUserId}`).emit('appointment_created', appointment);

  res.status(201).json({
    success: true,
    message: 'Appointment created successfully',
    appointment,
  });
});

// @desc    Get all appointments for user
// @route   GET /api/appointments
// @access  Private
export const getAppointments = asyncHandler(async (req, res, next) => {
  const { status, role } = req.query;
  let query = {};

  if (req.user.role === 'student') {
    query.studentId = req.user._id;
  } else if (req.user.role === 'lecturer') {
    query.lecturerId = req.user._id;
  }

  if (status) {
    query.status = status;
  }

  const appointments = await Appointment.find(query)
    .populate('studentId', 'firstName lastName email profilePicture')
    .populate('lecturerId', 'firstName lastName email profilePicture')
    .populate('bookedBy', 'firstName lastName')
    .populate('cancelledBy', 'firstName lastName')
    .sort({ scheduledDate: 1 });

  res.status(200).json({
    success: true,
    count: appointments.length,
    appointments,
  });
});

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointmentById = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('studentId', 'firstName lastName email profilePicture')
    .populate('lecturerId', 'firstName lastName email profilePicture')
    .populate('bookedBy', 'firstName lastName')
    .populate('cancelledBy', 'firstName lastName');

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  // Check authorization
  if (
    req.user._id.toString() !== appointment.studentId._id.toString() &&
    req.user._id.toString() !== appointment.lecturerId._id.toString() &&
    req.user.role !== 'administrator'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this appointment',
    });
  }

  res.status(200).json({
    success: true,
    appointment,
  });
});

// @desc    Update appointment status (lecturer confirms/declines)
// @route   PUT /api/appointments/:id/status
// @access  Private (Lecturer)
export const updateAppointmentStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status || !['confirmed', 'declined', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status provided',
    });
  }

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  // Only lecturer can confirm/decline
  if (req.user._id.toString() !== appointment.lecturerId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only the assigned lecturer can update this appointment',
    });
  }

  appointment.status = status;
  await appointment.save();

  await appointment.populate('studentId', 'firstName lastName email');
  await appointment.populate('lecturerId', 'firstName lastName email');
  await appointment.populate('bookedBy', 'firstName lastName');
  await appointment.populate('cancelledBy', 'firstName lastName');

  // Notify the student of the status change
  io.to(`user-${appointment.studentId._id}`).emit('appointment_status_updated', appointment);

  res.status(200).json({
    success: true,
    message: `Appointment ${status} successfully`,
    appointment,
  });
});

// @desc    Update appointment details
// @route   PUT /api/appointments/:id
// @access  Private
export const updateAppointment = asyncHandler(async (req, res, next) => {
  const { title, description, scheduledDate, scheduledTime, duration, location, notes } = req.body;

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  // Only student (who booked) or lecturer can update
  if (
    req.user._id.toString() !== appointment.studentId.toString() &&
    req.user._id.toString() !== appointment.lecturerId.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this appointment',
    });
  }

  // Update allowed fields
  if (title) appointment.title = title;
  if (description) appointment.description = description;
  if (scheduledDate) appointment.scheduledDate = new Date(scheduledDate);
  if (scheduledTime) appointment.scheduledTime = scheduledTime;
  if (duration) appointment.duration = duration;
  if (location) appointment.location = location;
  if (notes) appointment.notes = notes;

  await appointment.save();

  await appointment.populate('studentId', 'firstName lastName email');
  await appointment.populate('lecturerId', 'firstName lastName email');
  await appointment.populate('bookedBy', 'firstName lastName');

  res.status(200).json({
    success: true,
    message: 'Appointment updated successfully',
    appointment,
  });
});

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private
export const deleteAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  // Only student or lecturer can cancel
  if (
    req.user._id.toString() !== appointment.studentId.toString() &&
    req.user._id.toString() !== appointment.lecturerId.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this appointment',
    });
  }

  const { reason } = req.body;

  appointment.status = 'cancelled';
  appointment.cancelledBy = req.user._id;
  if (reason) appointment.cancellationReason = reason.trim();
  await appointment.save();

  await appointment.populate('studentId', 'firstName lastName email');
  await appointment.populate('lecturerId', 'firstName lastName email');
  await appointment.populate('bookedBy', 'firstName lastName');
  await appointment.populate('cancelledBy', 'firstName lastName');

  // Notify the other party of the cancellation
  const cancelNotifyId = req.user._id.toString() === appointment.studentId._id.toString()
    ? appointment.lecturerId._id
    : appointment.studentId._id;
  io.to(`user-${cancelNotifyId}`).emit('appointment_cancelled', appointment);

  res.status(200).json({
    success: true,
    message: 'Appointment cancelled successfully',
    appointment,
  });
});

// @desc    Get lecturer availability
// @route   GET /api/appointments/lecturer/:lecturerId/availability
// @access  Private
export const getLecturerAvailability = asyncHandler(async (req, res, next) => {
  const { date } = req.query;

  // Enforce domain isolation: student must be in same domain
  if (req.user.role !== 'administrator') {
    const lecturer = await User.findById(req.params.lecturerId);
    if (!lecturer || lecturer.department !== req.user.department || lecturer.group !== req.user.group) {
      return res.status(403).json({
        success: false,
        message: 'You can only view availability for lecturers in your department and group',
      });
    }
  }

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a date',
    });
  }

  // Get all appointments for this lecturer on the given date
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    lecturerId: req.params.lecturerId,
    scheduledDate: { $gte: startDate, $lte: endDate },
    status: { $ne: 'cancelled' },
  });

  res.status(200).json({
    success: true,
    date,
    bookedSlots: appointments,
    count: appointments.length,
  });
});
