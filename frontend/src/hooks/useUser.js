import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/apiService';

export const useUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchUser = useCallback(async (userId) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getById(userId);
      setUser(response.data.user);
      return response.data.user;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch user';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchLecturers = useCallback(async () => {
    if (!token) return [];
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getLecturers();
      return response.data.lecturers || [];
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch lecturers';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchStudents = useCallback(async () => {
    if (!token) return [];
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getAll({ role: 'student' });
      return response.data.users || [];
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch students';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { user, loading, error, fetchUser, fetchLecturers, fetchStudents };
};
