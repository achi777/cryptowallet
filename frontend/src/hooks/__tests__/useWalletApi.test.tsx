import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// axios v1 ships as ESM and Jest's CRA preset can't parse it; the actual axios
// surface is exercised via the spies below, so a stub instance is enough.
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    }),
  },
}));

import { walletApi } from '../../services/api';
import { CryptoCurrency, Wallet } from '../../types';
import { useUserWallets, useCreateWallet } from '../useWalletApi';
import { qk } from '../queryKeys';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, queryClient };
}

const sampleWallets: Wallet[] = [
  {
    id: 1,
    address: 'addr-1',
    currency: CryptoCurrency.BITCOIN,
    balance: 0.5,
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

describe('useUserWallets', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves with the payload returned by walletApi.getUserWallets', async () => {
    const spy = jest.spyOn(walletApi, 'getUserWallets').mockResolvedValue(sampleWallets);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useUserWallets(7), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith(7);
    expect(result.current.data).toEqual(sampleWallets);
  });

  it('is disabled when userId is undefined', () => {
    const spy = jest.spyOn(walletApi, 'getUserWallets').mockResolvedValue(sampleWallets);
    const { wrapper } = makeWrapper();

    renderHook(() => useUserWallets(undefined), { wrapper });

    expect(spy).not.toHaveBeenCalled();
  });
});

describe('useCreateWallet', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('invalidates the user-wallets cache on success', async () => {
    const created: Wallet = { ...sampleWallets[0], id: 99 };
    const apiSpy = jest.spyOn(walletApi, 'create').mockResolvedValue(created);
    const { wrapper, queryClient } = makeWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateWallet(), { wrapper });

    await result.current.mutateAsync({ userId: 42, data: { currency: CryptoCurrency.BITCOIN } });

    expect(apiSpy).toHaveBeenCalledWith(42, { currency: CryptoCurrency.BITCOIN });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.walletsByUser(42) });
  });
});
