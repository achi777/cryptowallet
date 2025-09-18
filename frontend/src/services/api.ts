import axios from 'axios';
import { User, UserRegistration, LoginCredentials, AuthResponse, Wallet, WalletCreation, Transaction, SendTransaction } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
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

export default api;