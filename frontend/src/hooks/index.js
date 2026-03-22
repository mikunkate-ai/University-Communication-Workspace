import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService, projectService, announcementService, appointmentService, userService } from '../services/apiService';
export { useUser } from './useUser';

export const useTask = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchTasks = useCallback(async (params = {}) => {
    if (!token) return [];
    setLoading(true);
    setError(null);
    try {
      const response = await taskService.getAll(params);
      setTasks(response.data.tasks || []);
      return response.data.tasks || [];
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch tasks';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateTaskStatus = useCallback(async (id, status) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const response = await taskService.updateStatus(id, status);
      setTasks(prev =>
        prev.map(task => (task._id === id ? response.data.task : task))
      );
      return response.data.task;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update task';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createTask = useCallback(async (data) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const response = await taskService.create(data);
      setTasks(prev => [...prev, response.data.task]);
      return response.data.task;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create task';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { tasks, loading, error, fetchTasks, updateTaskStatus, createTask };
};

export const useProject = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchProjects = useCallback(async (params = {}) => {
    if (!token) return [];
    setLoading(true);
    setError(null);
    try {
      const response = await projectService.getAll(params);
      setProjects(response.data.projects || []);
      return response.data.projects || [];
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch projects';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createProject = useCallback(async (data) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const response = await projectService.create(data);
      setProjects(prev => [...prev, response.data.project]);
      return response.data.project;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create project';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const submitProject = useCallback(async (projectId, data) => {
    if (!token) return null;
    try {
      const response = await projectService.submit(projectId, data);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit project';
      setError(message);
      return null;
    }
  }, [token]);

  return { projects, loading, error, fetchProjects, createProject, submitProject };
};

export const useAnnouncement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchAnnouncements = useCallback(async (params = {}) => {
    if (!token) return [];
    setLoading(true);
    setError(null);
    try {
      const response = await announcementService.getAll(params);
      setAnnouncements(response.data.announcements || []);
      return response.data.announcements || [];
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch announcements';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createAnnouncement = useCallback(async (data) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const response = await announcementService.create(data);
      setAnnouncements(prev => [...prev, response.data.announcement]);
      return response.data.announcement;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create announcement';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { announcements, loading, error, fetchAnnouncements, createAnnouncement };
};

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
    if (!token) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    try {
      const response = await appointmentService.create(data);
      setAppointments(prev => [...prev, response.data.appointment]);
      return response.data.appointment;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to create appointment';
      setError(message);
      throw new Error(message);
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

  const cancelAppointment = useCallback(async (id, reason) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const body = reason ? { reason } : undefined;
      const response = await appointmentService.delete(id, body);
      const cancelled = response.data.appointment;
      setAppointments(prev =>
        prev.map(apt => (apt._id === id ? cancelled : apt))
      );
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to cancel appointment';
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
    cancelAppointment,
    getLecturerAvailability,
  };
};


