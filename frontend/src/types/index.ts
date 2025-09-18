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