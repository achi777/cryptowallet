import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '../services/api';
import type { Transaction, SendTransaction } from '../types';
import { qk } from './queryKeys';

export function useWalletTransactions(walletId: number | undefined) {
  return useQuery<Transaction[]>({
    queryKey: qk.transactionsByWallet(walletId ?? -1),
    queryFn: () => transactionApi.getWalletTransactions(walletId as number),
    enabled: typeof walletId === 'number',
  });
}

export function useUserTransactions(userId: number | undefined) {
  return useQuery<Transaction[]>({
    queryKey: qk.transactionsByUser(userId ?? -1),
    queryFn: () => transactionApi.getUserTransactions(userId as number),
    enabled: typeof userId === 'number',
  });
}

export function useTransactionByHash(txHash: string | undefined) {
  return useQuery<Transaction>({
    queryKey: qk.transaction(txHash ?? ''),
    queryFn: () => transactionApi.getByHash(txHash as string),
    enabled: typeof txHash === 'string' && txHash.length > 0,
  });
}

// AC alias: useTransactions — same payload as useUserTransactions.
export const useTransactions = useUserTransactions;

export function useSendTransaction() {
  const qc = useQueryClient();
  return useMutation<Transaction, Error, SendTransaction>({
    mutationFn: (data) => transactionApi.send(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.transactionsRoot });
      qc.invalidateQueries({ queryKey: qk.walletsRoot });
    },
  });
}
