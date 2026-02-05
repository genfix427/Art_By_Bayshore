import api from './axios';

// Auth Services
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  updatePassword: (data) => api.put('/auth/update-password', data),
};

// Product Services
export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getBySlug: (slug) => api.get(`/products/slug/${slug}`),
  getById: (id) => api.get(`/products/${id}`),
  getRelated: (id) => api.get(`/products/${id}/related`),
  getFeatured: () => api.get('/products/featured/list'),
};

// Category Services
export const categoryService = {
  getAll: (params) => api.get('/categories', { params }),
  getBySlug: (slug) => api.get(`/categories/slug/${slug}`),
};

// Artist Services
export const artistService = {
  getAll: (params) => api.get('/artists', { params }),
  getBySlug: (slug) => api.get(`/artists/slug/${slug}`),
  getProducts: (id, params) => api.get(`/artists/${id}/products`, { params }),
};

// Cart Services
export const cartService = {
  get: () => api.get('/cart'),
  addItem: (data) => api.post('/cart/items', data),
  updateItem: (itemId, data) => api.put(`/cart/items/${itemId}`, data),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart'),
  sync: (data) => api.post('/cart/sync', data),
};

// Shipping Services
export const shippingService = {
  validateAddress: (data) => api.post('/shipping/validate-address', data),
  calculateRates: (data) => api.post('/shipping/calculate-rates', data),
  trackShipment: (trackingNumber) => api.get(`/shipping/track/${trackingNumber}`),
};

// Payment Services
export const paymentService = {
  createIntent: (data) => api.post('/payment/create-intent', data),
  confirmPayment: (data) => api.post('/payment/confirm', data),
  getMethods: () => api.get('/payment/methods'),
  createSetupIntent: () => api.post('/payment/setup-intent'),
};

// Order Services
export const orderService = {
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id, data) => api.post(`/orders/${id}/cancel`, data),
};

// Coupon Services
export const couponService = {
  validate: (data) => api.post('/coupons/validate', data),
};

// Inquiry Services
export const inquiryService = {
  create: (data) => api.post('/inquiries', data),
  getMyInquiries: (params) => api.get('/inquiries', { params }),
  getById: (id) => api.get(`/inquiries/${id}`),
};

// Newsletter Services
export const newsletterService = {
  subscribe: (data) => api.post('/newsletter/subscribe', data),
  unsubscribe: (token) => api.get(`/newsletter/unsubscribe/${token}`),
};

export const wishlistService = {
  getWishlist: () => api.get('/wishlist'),
  addToWishlist: (productId) => api.post('/wishlist', { productId }),
  removeFromWishlist: (productId) => api.delete(`/wishlist/${productId}`),
  checkWishlist: (productId) => api.get(`/wishlist/check/${productId}`),
  clearWishlist: () => api.delete('/wishlist'),
  getWishlistCount: () => api.get('/wishlist/count'),
  syncWishlist: (productIds) => api.post('/wishlist/sync', { productIds }),
};