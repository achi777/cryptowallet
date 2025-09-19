export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  active: boolean;
  wallets: Wallet[];
  createdAt: string;
  updatedAt: string;
}

export interface UserRegistration {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User | null;
  admin: Admin | null;
  success: boolean;
}

export interface Wallet {
  id: number;
  address: string;
  currency: CryptoCurrency;
  balance: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletCreation {
  currency: CryptoCurrency;
}

export interface Transaction {
  id: number;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  fee?: number;
  type: TransactionType;
  status: TransactionStatus;
  blockNumber?: number;
  confirmations?: number;
  memo?: string;
  createdAt: string;
}

export interface SendTransaction {
  walletId: number;
  toAddress: string;
  amount: number;
  memo?: string;
}

export enum CryptoCurrency {
  BITCOIN = 'BITCOIN',
  USDT_TRC20 = 'USDT_TRC20'
}

export enum TransactionType {
  SEND = 'SEND',
  RECEIVE = 'RECEIVE'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED'
}

// Admin types
export interface Admin {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRegistration {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
}

export interface AdminLogin {
  username: string;
  password: string;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalWallets: number;
  bitcoinWallets: number;
  usdtWallets: number;
  totalTransactions: number;
  pendingTransactions: number;
  confirmedTransactions: number;
  failedTransactions: number;
  totalBitcoinVolume: number;
  totalUsdtVolume: number;
  usersRegisteredToday: number;
  transactionsToday: number;
  lastUpdated: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
}

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  SUPPORT = 'SUPPORT'
}