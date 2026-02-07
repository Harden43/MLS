import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for 401 handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = res.data.data;

          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Products API
export const productsApi = {
  getAll: () => api.get('/products').then(res => res.data),
  getById: (id: number) => api.get(`/products/${id}`).then(res => res.data),
  create: (data: any) => api.post('/products', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/products/${id}`).then(res => res.data),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get('/categories').then(res => res.data),
  create: (data: { name: string; description?: string }) =>
    api.post('/categories', data).then(res => res.data),
  update: (id: number, data: { name?: string; description?: string }) =>
    api.put(`/categories/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/categories/${id}`).then(res => res.data),
};

// Suppliers API
export const suppliersApi = {
  getAll: () => api.get('/suppliers').then(res => res.data),
  getById: (id: number) => api.get(`/suppliers/${id}`).then(res => res.data),
  create: (data: any) => api.post('/suppliers', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/suppliers/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/suppliers/${id}`).then(res => res.data),
};

// Locations API
export const locationsApi = {
  getAll: () => api.get('/locations').then(res => res.data),
  create: (data: { name: string; code?: string; address?: string; type?: string }) =>
    api.post('/locations', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/locations/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/locations/${id}`).then(res => res.data),
};

// Inventory API
export const inventoryApi = {
  getAll: () => api.get('/inventory').then(res => res.data),
  upsert: (data: { productId: number; locationId: number; quantity: number }) =>
    api.post('/inventory', data).then(res => res.data),
};

// Stock Movements API
export const stockMovementsApi = {
  getAll: () => api.get('/stock-movements').then(res => res.data),
  create: (data: { productId: number; quantity: number; movementType: string; notes?: string; reference?: string }) =>
    api.post('/stock-movements', data).then(res => res.data),
};

// Purchase Orders API
export const purchaseOrdersApi = {
  getAll: () => api.get('/purchase-orders').then(res => res.data),
  getById: (id: number) => api.get(`/purchase-orders/${id}`).then(res => res.data),
  create: (data: {
    supplierId: number;
    items: { productId: number; quantity: number; unitPrice: number }[];
    notes?: string;
    expectedDate?: string;
  }) => api.post('/purchase-orders', data).then(res => res.data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/purchase-orders/${id}/status`, { status }).then(res => res.data),
  receive: (id: number, items: { itemId: number; receivedQty: number }[]) =>
    api.post(`/purchase-orders/${id}/receive`, { items }).then(res => res.data),
  delete: (id: number) => api.delete(`/purchase-orders/${id}`).then(res => res.data),
};

// Stock Adjustments API
export const stockAdjustmentsApi = {
  getAll: () => api.get('/stock-adjustments').then(res => res.data),
  create: (data: {
    productId: number;
    adjustmentType: string;
    quantity: number;
    reason?: string;
    reference?: string;
  }) => api.post('/stock-adjustments', data).then(res => res.data),
};

// Stock Transfers API
export const stockTransfersApi = {
  getAll: () => api.get('/stock-transfers').then(res => res.data),
  create: (data: {
    productId: number;
    fromLocationId: number;
    toLocationId: number;
    quantity: number;
    notes?: string;
  }) => api.post('/stock-transfers', data).then(res => res.data),
  complete: (id: number) => api.patch(`/stock-transfers/${id}/complete`).then(res => res.data),
};

// Alerts API
export const alertsApi = {
  getAll: () => api.get('/alerts').then(res => res.data),
  dismiss: (id: number) => api.patch(`/alerts/${id}/dismiss`).then(res => res.data),
  generateLowStock: () => api.post('/alerts/generate-low-stock').then(res => res.data),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats').then(res => res.data),
  getTopAtRisk: () => api.get('/dashboard/top-at-risk').then(res => res.data),
  getTopCashConsuming: () => api.get('/dashboard/top-cash-consuming').then(res => res.data),
  getSuppliersDelays: () => api.get('/dashboard/suppliers-delays').then(res => res.data),
};

// Customers API
export const customersApi = {
  getAll: (params?: { search?: string }) => api.get('/customers', { params }).then(res => res.data),
  getById: (id: number) => api.get(`/customers/${id}`).then(res => res.data),
  create: (data: any) => api.post('/customers', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/customers/${id}`).then(res => res.data),
};

// Sales Orders API
export const salesOrdersApi = {
  getAll: (params?: { status?: string }) => api.get('/sales-orders', { params }).then(res => res.data),
  getById: (id: number) => api.get(`/sales-orders/${id}`).then(res => res.data),
  create: (data: any) => api.post('/sales-orders', data).then(res => res.data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/sales-orders/${id}/status`, { status }).then(res => res.data),
  delete: (id: number) => api.delete(`/sales-orders/${id}`).then(res => res.data),
};

// Returns API
export const returnsApi = {
  getAll: (params?: { status?: string }) => api.get('/returns', { params }).then(res => res.data),
  getById: (id: number) => api.get(`/returns/${id}`).then(res => res.data),
  create: (data: any) => api.post('/returns', data).then(res => res.data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/returns/${id}/status`, { status }).then(res => res.data),
  delete: (id: number) => api.delete(`/returns/${id}`).then(res => res.data),
};

// Cycle Counts API
export const cycleCountsApi = {
  getAll: (params?: { status?: string }) => api.get('/cycle-counts', { params }).then(res => res.data),
  getById: (id: number) => api.get(`/cycle-counts/${id}`).then(res => res.data),
  create: (data: { locationId: number; notes?: string }) => api.post('/cycle-counts', data).then(res => res.data),
  submitItems: (id: number, items: { itemId: number; countedQty: number }[]) =>
    api.patch(`/cycle-counts/${id}/items`, { items }).then(res => res.data),
  complete: (id: number) => api.patch(`/cycle-counts/${id}/complete`).then(res => res.data),
  delete: (id: number) => api.delete(`/cycle-counts/${id}`).then(res => res.data),
};

// Reports API
export const reportsApi = {
  getInventoryValue: () => api.get('/reports/inventory-value').then(res => res.data),
  getLowStock: () => api.get('/reports/low-stock').then(res => res.data),
  getDeadStock: () => api.get('/reports/dead-stock').then(res => res.data),
  getMovementHistory: (params?: {
    startDate?: string;
    endDate?: string;
    productId?: number;
    movementType?: string;
  }) => api.get('/reports/movement-history', { params }).then(res => res.data),
  getUsage: () => api.get('/reports/usage').then(res => res.data),
};
