import axios from 'axios';
import {
  User,
  UserRegistration,
  LoginCredentials,
  AuthResponse,
  Wallet,
  WalletCreation,
  Transaction,
  SendTransaction,
  Admin,
  AdminRegistration,
  AdminLogin,
  AdminRole,
  ChangePassword,
  PageResponse,
  SystemStats,
} from '../types';

const API_BASE_URL = 'http://localhost:8080/api';
const ADMIN_API_BASE_URL = `${API_BASE_URL}/admin`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const adminAxios = axios.create({
  baseURL: ADMIN_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User API
export const userApi = {
  register: async (userData: UserRegistration): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/users/register', userData);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/users/login', credentials);
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  getByUsername: async (username: string): Promise<User> => {
    const response = await api.get<User>(`/users/username/${username}`);
    return response.data;
  },

  getAll: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  update: async (id: number, userData: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// Wallet API
export const walletApi = {
  create: async (userId: number, walletData: WalletCreation): Promise<Wallet> => {
    const response = await api.post<Wallet>(`/wallets/user/${userId}`, walletData);
    return response.data;
  },

  getUserWallets: async (userId: number): Promise<Wallet[]> => {
    const response = await api.get<Wallet[]>(`/wallets/user/${userId}`);
    return response.data;
  },

  getById: async (walletId: number): Promise<Wallet> => {
    const response = await api.get<Wallet>(`/wallets/${walletId}`);
    return response.data;
  },

  getByAddress: async (address: string): Promise<Wallet> => {
    const response = await api.get<Wallet>(`/wallets/address/${address}`);
    return response.data;
  },

  refreshBalance: async (walletId: number): Promise<void> => {
    await api.post(`/wallets/${walletId}/refresh-balance`);
  },

  deactivate: async (walletId: number): Promise<void> => {
    await api.delete(`/wallets/${walletId}`);
  },
};

// Transaction API
export const transactionApi = {
  send: async (transactionData: SendTransaction): Promise<Transaction> => {
    const response = await api.post<Transaction>('/transactions/send', transactionData);
    return response.data;
  },

  getWalletTransactions: async (walletId: number): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>(`/transactions/wallet/${walletId}`);
    return response.data;
  },

  getUserTransactions: async (userId: number): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>(`/transactions/user/${userId}`);
    return response.data;
  },

  getByHash: async (txHash: string): Promise<Transaction> => {
    const response = await api.get<Transaction>(`/transactions/hash/${txHash}`);
    return response.data;
  },
};

// Admin API — folded in from the deleted adminApi.ts (CRYPTOWALL-5).
// Backed server-side by a single User entity with role=ADMIN.
export const adminAuthApi = {
  login: async (credentials: AdminLogin): Promise<AuthResponse> => {
    const response = await adminAxios.post<AuthResponse>('/login', credentials);
    return response.data;
  },

  register: async (adminData: AdminRegistration): Promise<AuthResponse> => {
    const response = await adminAxios.post<AuthResponse>('/register', adminData);
    return response.data;
  },

  getById: async (id: number): Promise<Admin> => {
    const response = await adminAxios.get<Admin>(`/${id}`);
    return response.data;
  },

  getByUsername: async (username: string): Promise<Admin> => {
    const response = await adminAxios.get<Admin>(`/username/${username}`);
    return response.data;
  },

  getAll: async (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Promise<PageResponse<Admin>> => {
    const response = await adminAxios.get<PageResponse<Admin>>('', {
      params: { page, size, sortBy, sortDir },
    });
    return response.data;
  },

  search: async (query: string, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Promise<PageResponse<Admin>> => {
    const response = await adminAxios.get<PageResponse<Admin>>('/search', {
      params: { query, page, size, sortBy, sortDir },
    });
    return response.data;
  },

  getByRole: async (role: AdminRole): Promise<Admin[]> => {
    const response = await adminAxios.get<Admin[]>(`/role/${role}`);
    return response.data;
  },

  update: async (id: number, adminData: Partial<Admin>): Promise<Admin> => {
    const response = await adminAxios.put<Admin>(`/${id}`, adminData);
    return response.data;
  },

  deactivate: async (id: number): Promise<void> => {
    await adminAxios.put(`/${id}/deactivate`);
  },

  delete: async (id: number): Promise<void> => {
    await adminAxios.delete(`/${id}`);
  },

  changePassword: async (id: number, passwords: ChangePassword): Promise<string> => {
    const response = await adminAxios.post<string>(`/${id}/change-password`, passwords);
    return response.data;
  },

  getActiveCount: async (): Promise<number> => {
    const response = await adminAxios.get<number>('/stats/count');
    return response.data;
  },
};

export const adminDashboardApi = {
  getStats: async (): Promise<SystemStats> => {
    const response = await adminAxios.get<SystemStats>('/dashboard/stats');
    return response.data;
  },

  getAllUsers: async (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc', active?: boolean): Promise<PageResponse<User>> => {
    const response = await adminAxios.get<PageResponse<User>>('/dashboard/users', {
      params: { page, size, sortBy, sortDir, active },
    });
    return response.data;
  },

  searchUsers: async (query: string, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Promise<PageResponse<User>> => {
    const response = await adminAxios.get<PageResponse<User>>('/dashboard/users/search', {
      params: { query, page, size, sortBy, sortDir },
    });
    return response.data;
  },

  toggleUserStatus: async (id: number): Promise<User> => {
    const response = await adminAxios.put<User>(`/dashboard/users/${id}/toggle-status`);
    return response.data;
  },

  getAllWallets: async (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc', currency?: string, active?: boolean): Promise<PageResponse<Wallet>> => {
    const response = await adminAxios.get<PageResponse<Wallet>>('/dashboard/wallets', {
      params: { page, size, sortBy, sortDir, currency, active },
    });
    return response.data;
  },

  searchWallets: async (query: string, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Promise<PageResponse<Wallet>> => {
    const response = await adminAxios.get<PageResponse<Wallet>>('/dashboard/wallets/search', {
      params: { query, page, size, sortBy, sortDir },
    });
    return response.data;
  },

  toggleWalletStatus: async (id: number): Promise<void> => {
    await adminAxios.put(`/dashboard/wallets/${id}/toggle-status`);
  },

  refreshWalletBalance: async (id: number): Promise<void> => {
    await adminAxios.post(`/dashboard/wallets/${id}/refresh-balance`);
  },

  getAllTransactions: async (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc', status?: string, type?: string): Promise<PageResponse<Transaction>> => {
    const response = await adminAxios.get<PageResponse<Transaction>>('/dashboard/transactions', {
      params: { page, size, sortBy, sortDir, status, type },
    });
    return response.data;
  },

  searchTransactions: async (query: string, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Promise<PageResponse<Transaction>> => {
    const response = await adminAxios.get<PageResponse<Transaction>>('/dashboard/transactions/search', {
      params: { query, page, size, sortBy, sortDir },
    });
    return response.data;
  },

  getPendingTransactions: async (page = 0, size = 10): Promise<PageResponse<Transaction>> => {
    const response = await adminAxios.get<PageResponse<Transaction>>('/dashboard/transactions/pending', {
      params: { page, size },
    });
    return response.data;
  },

  getUsersRegisteredInPeriod: async (start: string, end: string): Promise<number> => {
    const response = await adminAxios.get<number>('/dashboard/analytics/users-registered', {
      params: { start, end },
    });
    return response.data;
  },

  getTransactionsInPeriod: async (start: string, end: string): Promise<number> => {
    const response = await adminAxios.get<number>('/dashboard/analytics/transactions', {
      params: { start, end },
    });
    return response.data;
  },

  getVolumeInPeriod: async (start: string, end: string, currency: string): Promise<number> => {
    const response = await adminAxios.get<number>('/dashboard/analytics/volume', {
      params: { start, end, currency },
    });
    return response.data;
  },
};

export default api;
