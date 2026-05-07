/**
 * Backend roles are USER and ADMIN after CRYPTOWALL-5. Legacy admin sub-role
 * strings (SUPER_ADMIN, MODERATOR, SUPPORT) may still appear in older UI
 * branches, so the type stays widened to `string` for that surface.
 */
export type Role = 'USER' | 'ADMIN' | string;

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: Role;
  active: boolean;
  lastLogin?: string;
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
  role?: Role;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UnifiedLoginCredentials {
  email: string;
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
  BROADCAST = 'BROADCAST',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED'
}

/**
 * Admin is a {@link User} with {@code role === 'ADMIN'} after CRYPTOWALL-5.
 * The alias is kept so existing admin UI components don't churn while the
 * type system still expresses "this surface only deals with admins".
 */
export type Admin = User;

export type AdminRegistration = UserRegistration;

export type AdminLogin = LoginCredentials;

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

/**
 * Server-side roles after CRYPTOWALL-5 collapsed to {USER, ADMIN}. Legacy
 * sub-role string values (SUPER_ADMIN, MODERATOR, SUPPORT) are kept here so
 * existing UI surfaces compile, but the backend will only persist USER/ADMIN.
 */
export const AdminRole = {
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  MODERATOR: 'MODERATOR',
  SUPPORT: 'SUPPORT',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AdminRole = typeof AdminRole[keyof typeof AdminRole];
