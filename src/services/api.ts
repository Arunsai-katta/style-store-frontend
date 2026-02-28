import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const message = (error.response?.data as any)?.message || 'Something went wrong';

    // Handle specific error codes
    if (error.response?.status === 401) {
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    // Show error toast for non-401 errors
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data: { name: string; email: string; phone?: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  adminLogin: (data: { email: string; password: string }) =>
    api.post('/auth/admin/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateDetails: (data: Partial<{ name: string; phone: string; avatar: string }>) =>
    api.put('/auth/updatedetails', data),
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/updatepassword', data),
  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgotpassword', data),
  resetPassword: (token: string, data: { password: string }) =>
    api.put(`/auth/resetpassword/${token}`, data),
};

// Product APIs
export const productAPI = {
  getProducts: (params?: Record<string, any>) =>
    api.get('/products', { params }),
  getProduct: (id: string) =>
    api.get(`/products/${id}`),
  getProductBySlug: (slug: string) =>
    api.get(`/products/slug/${slug}`),
  getNewArrivals: (limit?: number) =>
    api.get('/products/new-arrivals', { params: { limit } }),
  getFeaturedProducts: (limit?: number) =>
    api.get('/products/featured', { params: { limit } }),
  getProductsByCategory: (category: string, params?: Record<string, any>) =>
    api.get(`/products/category/${category}`, { params }),
  getProductFilters: (category: string) =>
    api.get(`/products/filters/${category}`),
  getRelatedProducts: (id: string) =>
    api.get(`/products/${id}/related`),

  // Admin
  createProduct: (data: any) =>
    api.post('/products', data),
  updateProduct: (id: string, data: any) =>
    api.put(`/products/${id}`, data),
  deleteProduct: (id: string) =>
    api.delete(`/products/${id}`),
  updateStock: (id: string, data: { colorVariantId: string; size: string; quantity: number }) =>
    api.put(`/products/${id}/stock`, data),
  toggleFeatured: (id: string) =>
    api.put(`/products/${id}/featured`),
  getAllProductsAdmin: (params?: Record<string, any>) =>
    api.get('/products/admin/all', { params }),
};

// Cart APIs
export const cartAPI = {
  getCart: () =>
    api.get('/cart'),
  addItem: (data: { productId: string; colorVariantId: string; size: string; quantity?: number }) =>
    api.post('/cart/items', data),
  updateQuantity: (itemId: string, quantity: number) =>
    api.put(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId: string) =>
    api.delete(`/cart/items/${itemId}`),
  clearCart: () =>
    api.delete('/cart'),
  applyCoupon: (code: string) =>
    api.post('/cart/coupon', { code }),
  removeCoupon: () =>
    api.delete('/cart/coupon'),
  syncCart: (items: any[]) =>
    api.post('/cart/sync', { items }),
};

// Order APIs
export const orderAPI = {
  createOrder: (data: any) =>
    api.post('/orders', data),
  verifyPayment: (data: { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; cartId?: string }) =>
    api.post('/orders/verify-payment', data),
  getOrders: (params?: Record<string, any>) =>
    api.get('/orders', { params }),
  getOrder: (id: string) =>
    api.get(`/orders/${id}`),
  getOrderByNumber: (orderNumber: string) =>
    api.get(`/orders/number/${orderNumber}`),
  cancelOrder: (id: string) =>
    api.put(`/orders/${id}/cancel`),
  retryPayment: (id: string) =>
    api.post(`/orders/${id}/retry-payment`),
  getTracking: (id: string) =>
    api.get(`/orders/${id}/tracking`),

  // Admin
  getAllOrders: (params?: Record<string, any>) =>
    api.get('/orders/admin/all', { params }),
  updateStatus: (id: string, data: { status: string; description?: string }) =>
    api.put(`/orders/${id}/status`, data),
  createShipment: (id: string, data: { weight: number; length: number; breadth: number; height: number }) =>
    api.post(`/orders/${id}/shipment`, data),
};

// User APIs
export const userAPI = {
  getProfile: () =>
    api.get('/users/profile'),
  updateProfile: (data: Partial<{ name: string; phone: string; avatar: string }>) =>
    api.put('/users/profile', data),
  addAddress: (data: any) =>
    api.post('/users/addresses', data),
  updateAddress: (addressId: string, data: any) =>
    api.put(`/users/addresses/${addressId}`, data),
  deleteAddress: (addressId: string) =>
    api.delete(`/users/addresses/${addressId}`),
  setDefaultAddress: (addressId: string) =>
    api.put(`/users/addresses/${addressId}/default`),
  getWishlist: () =>
    api.get('/users/wishlist'),
  addToWishlist: (productId: string) =>
    api.post('/users/wishlist', { productId }),
  removeFromWishlist: (productId: string) =>
    api.delete(`/users/wishlist/${productId}`),
};

// Review APIs
export const reviewAPI = {
  getProductReviews: (productId: string, params?: Record<string, any>) =>
    api.get(`/reviews/product/${productId}`, { params }),
  createReview: (data: any) =>
    api.post('/reviews', data),
  getMyReviews: () =>
    api.get('/reviews/my-reviews'),
  updateReview: (id: string, data: any) =>
    api.put(`/reviews/${id}`, data),
  deleteReview: (id: string) =>
    api.delete(`/reviews/${id}`),
  markHelpful: (id: string) =>
    api.post(`/reviews/${id}/helpful`),

  // Admin
  getAllReviews: (params?: Record<string, any>) =>
    api.get('/reviews/admin/all', { params }),
  respondToReview: (id: string, data: { comment: string }) =>
    api.put(`/reviews/${id}/respond`, data),
  toggleReview: (id: string) =>
    api.put(`/reviews/${id}/toggle`),
};

// Return APIs
export const returnAPI = {
  createReturn: (data: any) =>
    api.post('/returns', data),
  getReturns: (params?: Record<string, any>) =>
    api.get('/returns', { params }),
  getMyReturns: (params?: Record<string, any>) =>
    api.get('/returns', { params }),
  getReturn: (id: string) =>
    api.get(`/returns/${id}`),
  getRefundStatus: (id: string) =>
    api.get(`/returns/${id}/refund-status`),
  cancelReturn: (id: string) =>
    api.put(`/returns/${id}/cancel`),

  // Admin
  getAllReturns: (params?: Record<string, any>) =>
    api.get('/returns/admin/all', { params }),
  getReturnStatistics: (params?: Record<string, any>) =>
    api.get('/returns/admin/statistics', { params }),
  approveReturn: (id: string, data?: { adminNotes?: string }) =>
    api.put(`/returns/${id}/approve`, data),
  rejectReturn: (id: string, data?: { reason?: string }) =>
    api.put(`/returns/${id}/reject`, data),
  inspectReturn: (id: string, data: any) =>
    api.put(`/returns/${id}/inspect`, data),
  processRefund: (id: string) =>
    api.put(`/returns/${id}/refund`),
  markRefunded: (id: string, data?: { transactionReference?: string }) =>
    api.put(`/returns/${id}/mark-refunded`, data),
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: (params?: Record<string, any>) =>
    api.get('/dashboard/stats', { params }),
  getSalesStats: (params?: Record<string, any>) =>
    api.get('/dashboard/sales', { params }),
  getProductStats: (params?: Record<string, any>) =>
    api.get('/dashboard/products', { params }),
  getCustomerStats: (params?: Record<string, any>) =>
    api.get('/dashboard/customers', { params }),
  getOrderStats: (params?: Record<string, any>) =>
    api.get('/dashboard/orders', { params }),
};

// Admin APIs
export const adminAPI = {
  getUsers: (params?: Record<string, any>) =>
    api.get('/admin/users', { params }),
  getUser: (id: string) =>
    api.get(`/admin/users/${id}`),
  updateUser: (id: string, data: any) =>
    api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`),
  getOverview: () =>
    api.get('/admin/overview'),
  getSettings: () =>
    api.get('/admin/settings'),
  updateSettings: (data: any) =>
    api.put('/admin/settings', data),

  // Products
  getProducts: (params?: Record<string, any>) =>
    api.get('/products/admin/all', { params }),
  deleteProduct: (id: string) =>
    api.delete(`/products/${id}`),

  // Orders
  getOrders: (params?: Record<string, any>) =>
    api.get('/orders/admin/all', { params }),
  updateOrderStatus: (id: string, data: { status: string; description?: string }) =>
    api.put(`/orders/${id}/status`, data),

  // Returns
  getReturns: (params?: Record<string, any>) =>
    api.get('/returns/admin/all', { params }),
  approveReturn: (id: string, data?: { adminNotes?: string }) =>
    api.put(`/returns/${id}/approve`, data),
  rejectReturn: (id: string, data?: { reason?: string }) =>
    api.put(`/returns/${id}/reject`, data),

  // Customers
  getCustomers: (params?: Record<string, any>) =>
    api.get('/admin/customers', { params }),
  getCustomerOrders: (id: string) =>
    api.get(`/admin/customers/${id}/orders`),
};

// Payment APIs
export const paymentAPI = {
  getConfig: () =>
    api.get('/payments/config'),
  getRazorpayKey: () =>
    api.get('/payments/razorpay-key'),
  createOrder: (data: { amount: number; receipt: string; notes?: any }) =>
    api.post('/payments/create-order', data),
  verifyPayment: (data: any) =>
    api.post('/payments/verify', data),
  processRefund: (data: { paymentId: string; amount?: number; notes?: any }) =>
    api.post('/payments/refund', data),
};

// Shipping APIs
export const shippingAPI = {
  getConfig: () =>
    api.get('/shipping/config'),
  checkServiceability: (params: { pickupPincode: string; deliveryPincode: string; weight?: number; cod?: boolean }) =>
    api.get('/shipping/serviceability', { params }),
  estimateShipping: (data: any) =>
    api.post('/shipping/estimate', data),
  getTracking: (awbCode: string) =>
    api.get(`/shipping/track/${awbCode}`),
  getCouriers: () =>
    api.get('/shipping/couriers'),
};

// Upload APIs
export const uploadAPI = {
  uploadSingle: (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (folder) formData.append('folder', folder);
    return api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files: File[], folder?: string) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    if (folder) formData.append('folder', folder);
    return api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (key: string) =>
    api.delete('/upload', { data: { key } }),
  deleteByUrl: (url: string) =>
    api.delete('/upload/by-url', { data: { url } }),
};

export default api;
