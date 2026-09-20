import api from './api';

export { transactionService } from './transactionService';
export { authService } from './authService';

export const investigationService = {
  list: (params) => api.get('/investigations', { params }).then((r) => r.data),
  get: (id) => api.get(`/investigations/${id}`).then((r) => r.data),
  create: (payload) => api.post('/investigations', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/investigations/${id}`, payload).then((r) => r.data),
  addNote: (id, text) => api.post(`/investigations/${id}/notes`, { text }).then((r) => r.data),
  linkTransaction: (id, transactionId) =>
    api.post(`/investigations/${id}/link-transaction`, { transactionId }).then((r) => r.data),
};

export const userService = {
  list: (params) => api.get('/users', { params }).then((r) => r.data),
  get: (id) => api.get(`/users/${id}`).then((r) => r.data),
  updateProfile: (payload) => api.put('/users/profile', payload).then((r) => r.data),
  changePassword: (payload) => api.put('/users/change-password', payload).then((r) => r.data),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }).then((r) => r.data),
  updateStatus: (id, isActive) => api.put(`/users/${id}/status`, { isActive }).then((r) => r.data),
};

export const notificationService = {
  list: (params) => api.get('/notifications', { params }).then((r) => r.data),
  markAsRead: (id) => api.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllAsRead: () => api.put('/notifications/read-all').then((r) => r.data),
};

export const auditLogService = {
  list: (params) => api.get('/audit-logs', { params }).then((r) => r.data),
};

export const dashboardService = {
  statistics: () => api.get('/dashboard/statistics').then((r) => r.data),
};
