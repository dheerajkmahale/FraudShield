import api from './api';

export const transactionService = {
  list: (params) => api.get('/transactions', { params }).then((r) => r.data),
  suspicious: (params) => api.get('/transactions/suspicious', { params }).then((r) => r.data),
  get: (id) => api.get(`/transactions/${id}`).then((r) => r.data),
  create: (payload) => api.post('/transactions', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/transactions/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/transactions/${id}`).then((r) => r.data),
  statistics: () => api.get('/transactions/statistics').then((r) => r.data),
  network: (params) => api.get('/transactions/network', { params }).then((r) => r.data),
};
