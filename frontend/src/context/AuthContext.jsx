import React, { createContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { setApiToken } from '../services/apiService';

export const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep axios.defaults in sync (used for auth/me calls on this instance)
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Restore user from token on page load / hard refresh
  useEffect(() => {
    if (!token) return;
    axios.get(`${API_BASE_URL}/auth/me`)
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        setApiToken(null);
        setToken(null);
        setUser(null);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Register user
  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      // Update in-memory token immediately — this tab's apiClient uses this, not localStorage
      setApiToken(data.token);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, data };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Login user
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });
      // Update in-memory token immediately — this tab's apiClient uses this, not localStorage
      setApiToken(data.token);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, data };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (token) {
        await axios.post(`${API_BASE_URL}/auth/logout`);
      }
      setApiToken(null);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Logout failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Get current user
  const getCurrentUser = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/auth/me`);
      setUser(data.user);
      return { success: true, data: data.user };
    } catch (err) {
      setApiToken(null);
      setToken(null);
      setUser(null);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Update user profile
  const updateProfile = useCallback(async (userId, userData) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.put(`${API_BASE_URL}/users/${userId}`, userData);
      setUser(data.user);
      return { success: true, data: data.user };
    } catch (err) {
      const message = err.response?.data?.message || 'Update failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete / deactivate account
  const deleteAccount = useCallback(async (userId, permanent = false) => {
    setLoading(true);
    setError(null);
    try {
      const query = permanent ? '?permanent=true' : '';
      await axios.delete(`${API_BASE_URL}/users/${userId}${query}`);
      setApiToken(null);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Account deletion failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    register,
    login,
    logout,
    getCurrentUser,
    updateProfile,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
