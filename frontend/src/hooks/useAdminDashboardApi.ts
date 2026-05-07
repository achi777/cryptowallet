import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminDashboardApi } from '../services/api';
import type {
  PageResponse,
  SystemStats,
  Transaction,
  User,
  Wallet,
} from '../types';
import { qk } from './queryKeys';

export interface AdminPageParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface AdminUsersParams extends AdminPageParams {
  active?: boolean;
}

export interface AdminWalletsParams extends AdminPageParams {
  currency?: string;
  active?: boolean;
}

export interface AdminTransactionsParams extends AdminPageParams {
  status?: string;
  type?: string;
}

export interface AdminSearchParams extends AdminPageParams {
  query: string;
}

// AC alias: useAdminStats — wraps adminDashboardApi.getStats().
export function useAdminStats() {
  return useQuery<SystemStats>({
    queryKey: qk.adminStats,
    queryFn: () => adminDashboardApi.getStats(),
  });
}

export function useAdminAllUsers(params: AdminUsersParams = {}) {
  const { page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc', active } = params;
  return useQuery<PageResponse<User>>({
    queryKey: qk.adminUsers({ page, size, sortBy, sortDir, active }),
    queryFn: () => adminDashboardApi.getAllUsers(page, size, sortBy, sortDir, active),
  });
}

export function useAdminSearchUsers(params: AdminSearchParams, enabled = true) {
  const { query, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc' } = params;
  return useQuery<PageResponse<User>>({
    queryKey: qk.adminUsersSearch({ query, page, size, sortBy, sortDir }),
    queryFn: () => adminDashboardApi.searchUsers(query, page, size, sortBy, sortDir),
    enabled: enabled && query.length > 0,
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useMutation<User, Error, number>({
    mutationFn: (id) => adminDashboardApi.toggleUserStatus(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: qk.usersRoot });
    },
  });
}

export function useAdminAllWallets(params: AdminWalletsParams = {}) {
  const { page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc', currency, active } = params;
  return useQuery<PageResponse<Wallet>>({
    queryKey: qk.adminWallets({ page, size, sortBy, sortDir, currency, active }),
    queryFn: () => adminDashboardApi.getAllWallets(page, size, sortBy, sortDir, currency, active),
  });
}

export function useAdminSearchWallets(params: AdminSearchParams, enabled = true) {
  const { query, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc' } = params;
  return useQuery<PageResponse<Wallet>>({
    queryKey: qk.adminWalletsSearch({ query, page, size, sortBy, sortDir }),
    queryFn: () => adminDashboardApi.searchWallets(query, page, size, sortBy, sortDir),
    enabled: enabled && query.length > 0,
  });
}

export function useToggleWalletStatus() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => adminDashboardApi.toggleWalletStatus(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'wallets'] });
      qc.invalidateQueries({ queryKey: qk.walletsRoot });
    },
  });
}

export function useAdminRefreshWalletBalance() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => adminDashboardApi.refreshWalletBalance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'wallets'] });
      qc.invalidateQueries({ queryKey: qk.walletsRoot });
    },
  });
}

export function useAdminAllTransactions(params: AdminTransactionsParams = {}) {
  const { page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc', status, type } = params;
  return useQuery<PageResponse<Transaction>>({
    queryKey: qk.adminTransactions({ page, size, sortBy, sortDir, status, type }),
    queryFn: () => adminDashboardApi.getAllTransactions(page, size, sortBy, sortDir, status, type),
  });
}

export function useAdminSearchTransactions(params: AdminSearchParams, enabled = true) {
  const { query, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc' } = params;
  return useQuery<PageResponse<Transaction>>({
    queryKey: qk.adminTransactionsSearch({ query, page, size, sortBy, sortDir }),
    queryFn: () => adminDashboardApi.searchTransactions(query, page, size, sortBy, sortDir),
    enabled: enabled && query.length > 0,
  });
}

export function useAdminPendingTransactions(page = 0, size = 10) {
  return useQuery<PageResponse<Transaction>>({
    queryKey: qk.adminTransactionsPending({ page, size }),
    queryFn: () => adminDashboardApi.getPendingTransactions(page, size),
  });
}

export function useAdminUsersRegisteredInPeriod(start: string, end: string, enabled = true) {
  return useQuery<number>({
    queryKey: qk.adminAnalyticsUsers(start, end),
    queryFn: () => adminDashboardApi.getUsersRegisteredInPeriod(start, end),
    enabled: enabled && start.length > 0 && end.length > 0,
  });
}

export function useAdminTransactionsInPeriod(start: string, end: string, enabled = true) {
  return useQuery<number>({
    queryKey: qk.adminAnalyticsTx(start, end),
    queryFn: () => adminDashboardApi.getTransactionsInPeriod(start, end),
    enabled: enabled && start.length > 0 && end.length > 0,
  });
}

export function useAdminVolumeInPeriod(start: string, end: string, currency: string, enabled = true) {
  return useQuery<number>({
    queryKey: qk.adminAnalyticsVolume(start, end, currency),
    queryFn: () => adminDashboardApi.getVolumeInPeriod(start, end, currency),
    enabled: enabled && start.length > 0 && end.length > 0 && currency.length > 0,
  });
}
