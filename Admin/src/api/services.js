import api from './axios';

// Auth Services
export const authService = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
};

// Category Services
export const categoryService = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Artist Services
export const artistService = {
  getAll: (params) => api.get('/artists', { params }),
  getById: (id) => api.get(`/artists/${id}`),
  create: (data) => api.post('/artists', data),
  update: (id, data) => api.put(`/artists/${id}`, data),
  delete: (id) => api.delete(`/artists/${id}`),
};

// Product Services
export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  deleteImage: (productId, imageId) => api.delete(`/products/${productId}/images/${imageId}`),
  delete: (id) => api.delete(`/products/${id}`),
};

// Order Services
export const orderService = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  createShipment: (id) => api.post(`/orders/${id}/ship`),
  updateTracking: (id) => api.post(`/orders/${id}/update-tracking`),
  getStats: () => api.get('/orders/stats/overview'),
};

// Coupon Services
export const couponService = {
  getAll: (params) => api.get('/coupons', { params }),
  getById: (id) => api.get(`/coupons/${id}`),
  getStats: (id) => api.get(`/coupons/${id}/stats`),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
};

// Inquiry Services
export const inquiryService = {
  getAll: (params) => api.get('/inquiries', { params }),
  getById: (id) => api.get(`/inquiries/${id}`),
  updateStatus: (id, data) => api.put(`/inquiries/${id}/status`, data),
  respond: (id, data) => api.post(`/inquiries/${id}/respond`, data),
  addNote: (id, data) => api.post(`/inquiries/${id}/notes`, data),
  delete: (id) => api.delete(`/inquiries/${id}`),
  getStats: () => api.get('/inquiries/stats/overview'),
};

// Newsletter Services
export const newsletterService = {
  getSubscribers: (params) => api.get('/newsletter/subscribers', { params }),
  updateSubscriber: (id, data) => api.put(`/newsletter/subscribers/${id}`, data),
  deleteSubscriber: (id) => api.delete(`/newsletter/subscribers/${id}`),
  getCampaigns: (params) => api.get('/newsletter/campaigns', { params }),
  getCampaign: (id) => api.get(`/newsletter/campaigns/${id}`),
  createCampaign: (data) => api.post('/newsletter/campaigns', data),
  updateCampaign: (id, data) => api.put(`/newsletter/campaigns/${id}`, data),
  sendCampaign: (id) => api.post(`/newsletter/campaigns/${id}/send`),
  deleteCampaign: (id) => api.delete(`/newsletter/campaigns/${id}`),
  getStats: () => api.get('/newsletter/stats'),
};