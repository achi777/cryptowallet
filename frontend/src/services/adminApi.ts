import axios from 'axios';
import { Admin, AdminRegistration, AdminLogin, AuthResponse, SystemStats, PageResponse, User, Wallet, Transaction, ChangePassword, AdminRole } from '../types';

const API_BASE_URL = 'http://localhost:8080/api/admin';

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Admin Authentication
export const adminAuthApi = {
  login: async (credentials: AdminLogin): Promise<AuthResponse> => {
    const response = await adminApi.post<AuthResponse>('/login', credentials);
    return response.data;
  },
  
  register: async (adminData: AdminRegistration): Promise<AuthResponse> => {
    const response = await adminApi.post<AuthResponse>('/register', adminData);
    return response.data;
  },
  
  getById: async (id: number): Promise<Admin> => {
    const response = await adminApi.get<Admin>(`/${id}`);
    return response.data;
  },
  
  getByUsername: async (username: string): Promise<Admin> => {
    const response = await adminApi.get<Admin>(`/username/${username}`);
    return response.data;
  },
  
  getAll: async (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Promise<PageResponse<Admin>> => {
    const response = await adminApi.get<PageResponse<Admin>>('/', {
      params: { page, size, sortBy, sortDir }
    });
    return response.data;
  },
  
  search: async (query: string, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Promise<PageResponse<Admin>> => {
    const response = await adminApi.get<PageResponse<Admin>>('/search', {
      params: { query, page, size, sortBy, sortDir }
    });
    return response.data;
  },
  
  getByRole: async (role: AdminRole): Promise<Admin[]> => {
    const response = await adminApi.get<Admin[]>(`/role/${role}`);
    return response.data;
  },
  
  update: async (id: number, adminData: Partial<Admin>): Promise<Admin> => {
    const response = await adminApi.put<Admin>(`/${id}`, adminData);
    return response.data;
  },
  
  deactivate: async (id: number): Promise<void> => {
    await adminApi.put(`/${id}/deactivate`);
  },
  
  delete: async (id: number): Promise<void> => {
    await adminApi.delete(`/${id}`);
  },
  
  changePassword: async (id: number, passwords: ChangePassword): Promise<string> => {
    const response = await adminApi.post<string>(`/${id}/change-password`, passwords);
    return response.data;
  },
  
  getActiveCount: async (): Promise<number> => {
    const response = await adminApi.get<number>('/stats/count');
    return response.data;
  },
};

// Dashboard API
export const adminDashboardApi = {
  getStats: async (): Promise<SystemStats> => {
    const response = await adminApi.get<SystemStats>('/dashboard/stats');
    return response.data;
  },
  
  // User Management
  getAllUsers: async (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc', active?: boolean): Promise<PageResponse<User>> => {
    const response = await adminApi.get<PageResponse<User>>('/dashboard/users', {
      params: { page, size, sortBy, sortDir, active }
    });
    return response.data;
  },
  
  searchUsers: async (query: string, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Promise<PageResponse<User>> => {
    const response = await adminApi.get<PageResponse<User>>('/dashboard/users/search', {
      params: { query, page, size, sortBy, sortDir }
    });
    return response.data;
  },
  
  toggleUserStatus: async (id: number): Promise<User> => {
    const response = await adminApi.put<User>(`/dashboard/users/${id}/toggle-status`);
    return response.data;
  },
  
  // Wallet Management
  getAllWallets: async (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc', currency?: string, active?: boolean): Promise<PageResponse<Wallet>> => {
    const response = await adminApi.get<PageResponse<Wallet>>('/dashboard/wallets', {
      params: { page, size, sortBy, sortDir, currency, active }
    });
    return response.data;
  },
  
  searchWallets: async (query: string, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Promise<PageResponse<Wallet>> => {
    const response = await adminApi.get<PageResponse<Wallet>>('/dashboard/wallets/search', {
      params: { query, page, size, sortBy, sortDir }
    });
    return response.data;
  },
  
  toggleWalletStatus: async (id: number): Promise<void> => {
    await adminApi.put(`/dashboard/wallets/${id}/toggle-status`);
  },
  
  refreshWalletBalance: async (id: number): Promise<void> => {
    await adminApi.post(`/dashboard/wallets/${id}/refresh-balance`);
  },
  
  // Transaction Management
  getAllTransactions: async (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc', status?: string, type?: string): Promise<PageResponse<Transaction>> => {
    const response = await adminApi.get<PageResponse<Transaction>>('/dashboard/transactions', {
      params: { page, size, sortBy, sortDir, status, type }
    });
    return response.data;
  },
  
  searchTransactions: async (query: string, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Promise<PageResponse<Transaction>> => {
    const response = await adminApi.get<PageResponse<Transaction>>('/dashboard/transactions/search', {
      params: { query, page, size, sortBy, sortDir }
    });
    return response.data;
  },
  
  getPendingTransactions: async (page = 0, size = 10): Promise<PageResponse<Transaction>> => {
    const response = await adminApi.get<PageResponse<Transaction>>('/dashboard/transactions/pending', {
      params: { page, size }
    });
    return response.data;
  },
  
  // Analytics
  getUsersRegisteredInPeriod: async (start: string, end: string): Promise<number> => {
    const response = await adminApi.get<number>('/dashboard/analytics/users-registered', {
      params: { start, end }
    });
    return response.data;
  },
  
  getTransactionsInPeriod: async (start: string, end: string): Promise<number> => {
    const response = await adminApi.get<number>('/dashboard/analytics/transactions', {
      params: { start, end }
    });
    return response.data;
  },
  
  getVolumeInPeriod: async (start: string, end: string, currency: string): Promise<number> => {
    const response = await adminApi.get<number>('/dashboard/analytics/volume', {
      params: { start, end, currency }
    });
    return response.data;
  },
};

export default adminApi;