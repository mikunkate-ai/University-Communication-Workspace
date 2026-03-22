import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/apiService';

export const useAppointment = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchAppointments = useCallback(async (params = {}) => {
    if (!token) return [];
    setLoading(true);
    setError(null);
    try {
      const response = await appointmentService.getAll(params);
      setAppointments(response.data.appointments || []);
      return response.data.appointments || [];
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch appointments';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createAppointment = useCallback(async (data) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const response = await appointmentService.create(data);
      setAppointments(prev => [...prev, response.data.appointment]);
      return response.data.appointment;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create appointment';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateAppointmentStatus = useCallback(async (id, status) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const response = await appointmentService.updateStatus(id, status);
      setAppointments(prev =>
        prev.map(apt => (apt._id === id ? response.data.appointment : apt))
      );
      return response.data.appointment;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update appointment';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const getLecturerAvailability = useCallback(async (lecturerId, date) => {
    if (!token) return [];
    setLoading(true);
    setError(null);
    try {
      const response = await appointmentService.getLecturerAvailability(lecturerId, date);
      return response.data.bookedSlots || [];
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch availability';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    updateAppointmentStatus,
    getLecturerAvailability,
  };
};
