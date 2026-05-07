import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '../services/api';
import type { Wallet, WalletCreation } from '../types';
import { qk } from './queryKeys';

export function useUserWallets(userId: number | undefined) {
  return useQuery<Wallet[]>({
    queryKey: qk.walletsByUser(userId ?? -1),
    queryFn: () => walletApi.getUserWallets(userId as number),
    enabled: typeof userId === 'number',
  });
}

export function useWalletById(walletId: number | undefined) {
  return useQuery<Wallet>({
    queryKey: qk.wallet(walletId ?? -1),
    queryFn: () => walletApi.getById(walletId as number),
    enabled: typeof walletId === 'number',
  });
}

export function useWalletByAddress(address: string | undefined) {
  return useQuery<Wallet>({
    queryKey: qk.walletByAddress(address ?? ''),
    queryFn: () => walletApi.getByAddress(address as string),
    enabled: typeof address === 'string' && address.length > 0,
  });
}

// AC alias: useUserBalance — returns the same Wallet[] payload as useUserWallets;
// each Wallet carries { currency, balance } so consumers read balances off it.
export const useUserBalance = useUserWallets;

export function useCreateWallet() {
  const qc = useQueryClient();
  return useMutation<Wallet, Error, { userId: number; data: WalletCreation }>({
    mutationFn: ({ userId, data }) => walletApi.create(userId, data),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: qk.walletsByUser(userId) });
    },
  });
}

export function useRefreshBalance() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (walletId) => walletApi.refreshBalance(walletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.walletsRoot });
    },
  });
}

export function useDeactivateWallet() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (walletId) => walletApi.deactivate(walletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.walletsRoot });
    },
  });
}
