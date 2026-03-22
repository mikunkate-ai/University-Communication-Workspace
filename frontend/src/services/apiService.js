import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-memory token — isolated per browser tab, not shared via localStorage
let _token = localStorage.getItem('token') || null;

// Called by AuthContext immediately on login/register/logout
export const setApiToken = (token) => {
  _token = token;
};

// Attach the in-memory token to every request
apiClient.interceptors.request.use((config) => {
  if (_token) {
    config.headers['Authorization'] = `Bearer ${_token}`;
  }
  return config;
});

// User Services
export const userService = {
  getAll: (params) => apiClient.get('/users', { params }),
  getById: (id) => apiClient.get(`/users/${id}`),
  getLecturers: () => apiClient.get('/users/lecturers'),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  delete: (id, permanent = false) => apiClient.delete(`/users/${id}`, { params: { permanent } }),
  reactivate: (id) => apiClient.put(`/users/${id}/reactivate`),
};

// Appointment Services
export const appointmentService = {
  create: (data) => apiClient.post('/appointments', data),
  getAll: (params) => apiClient.get('/appointments', { params }),
  getById: (id) => apiClient.get(`/appointments/${id}`),
  update: (id, data) => apiClient.put(`/appointments/${id}`, data),
  updateStatus: (id, status) => apiClient.put(`/appointments/${id}/status`, { status }),
  delete: (id, data) => apiClient.delete(`/appointments/${id}`, { data }),
  getLecturerAvailability: (lecturerId, date) =>
    apiClient.get(`/appointments/lecturer/${lecturerId}/availability`, { params: { date } }),
};

// Message Services
export const messageService = {
  send: (data) => apiClient.post('/messages', data),
  sendGroup: (groupId, data) => apiClient.post(`/messages/group/${groupId}`, data),
  getConversations: () => apiClient.get('/messages/conversations'),
  getDirectMessages: (userId, params) =>
    apiClient.get(`/messages/conversation/${userId}`, { params }),
  getGroupMessages: (groupId, params) =>
    apiClient.get(`/messages/group/${groupId}`, { params }),
  getUnreadCount: () => apiClient.get('/messages/unread/count'),
  markAsRead: (id) => apiClient.put(`/messages/${id}/read`),
  edit: (id, data) => apiClient.put(`/messages/${id}`, data),
  delete: (id) => apiClient.delete(`/messages/${id}`),
};

// Project Services
export const projectService = {
  create: (data) => apiClient.post('/projects', data),
  getAll: (params) => apiClient.get('/projects', { params }),
  getById: (id) => apiClient.get(`/projects/${id}`),
  update: (id, data) => apiClient.put(`/projects/${id}`, data),
  delete: (id) => apiClient.delete(`/projects/${id}`),
  addMember: (id, userId) => apiClient.post(`/projects/${id}/members`, { userId }),
  submit: (id, data) => apiClient.post(`/projects/${id}/submissions`, data),
  getSubmissions: (id) => apiClient.get(`/projects/${id}/submissions`),
  addFeedback: (submissionId, data) =>
    apiClient.post(`/projects/submissions/${submissionId}/feedback`, data),
};

// Task Services
export const taskService = {
  create: (data) => apiClient.post('/tasks', data),
  getAll: (params) => apiClient.get('/tasks', { params }),
  getById: (id) => apiClient.get(`/tasks/${id}`),
  update: (id, data) => apiClient.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => apiClient.put(`/tasks/${id}/status`, { status }),
  delete: (id) => apiClient.delete(`/tasks/${id}`),
};

// Announcement Services
export const announcementService = {
  create: (data) => apiClient.post('/announcements', data),
  getAll: (params) => apiClient.get('/announcements', { params }),
  getById: (id) => apiClient.get(`/announcements/${id}`),
  update: (id, data) => apiClient.put(`/announcements/${id}`, data),
  delete: (id) => apiClient.delete(`/announcements/${id}`),
};

// Notification Services
export const notificationService = {
  getAll: (params) => apiClient.get('/notifications', { params }),
  getUnreadCount: () => apiClient.get('/notifications/unread/count'),
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
  delete: (id) => apiClient.delete(`/notifications/${id}`),
  clearRead: () => apiClient.delete('/notifications/clear/read'),
};

export default apiClient;
