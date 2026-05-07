import React, { useState } from 'react';
import { useUserWallets, useCreateWallet, useRefreshBalance } from '../hooks';
import { Wallet, CryptoCurrency } from '../types';

interface WalletListProps {
  userId: number;
  onWalletSelect: (wallet: Wallet) => void;
}

const WalletList: React.FC<WalletListProps> = ({ userId, onWalletSelect }) => {
  const walletsQuery = useUserWallets(userId);
  const createMutation = useCreateWallet();
  const refreshMutation = useRefreshBalance();
  const wallets: Wallet[] = walletsQuery.data ?? [];
  const loading = walletsQuery.isPending;
  const creating = createMutation.isPending;
  const [error, setError] = useState<string | null>(null);

  const queryError =
    (walletsQuery.error as any)?.response?.data?.message ||
    (walletsQuery.error ? 'Failed to load wallets' : null);
  const displayError = error || queryError;

  const createWallet = async (currency: CryptoCurrency) => {
    setError(null);
    try {
      await createMutation.mutateAsync({ userId, data: { currency } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create wallet');
    }
  };

  const refreshBalance = async (walletId: number) => {
    setError(null);
    try {
      await refreshMutation.mutateAsync(walletId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to refresh balance');
    }
  };

  const getCurrencySymbol = (currency: CryptoCurrency) => {
    switch (currency) {
      case CryptoCurrency.BITCOIN:
        return 'BTC';
      case CryptoCurrency.USDT_TRC20:
        return 'USDT';
      default:
        return currency;
    }
  };

  if (loading) {
    return <div>Loading wallets...</div>;
  }

  return (
    <div>
      {/* Create New Wallet Section */}
      <div className="card mb-4">
        <h3 className="text-xl mb-3" style={{ color: '#667eea' }}>
          💼 My Wallets
        </h3>
        
        <h4 className="mb-3">Create New Wallet</h4>
        <div className="flex" style={{ gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => createWallet(CryptoCurrency.BITCOIN)}
            disabled={creating}
            className="btn btn-secondary"
            style={{ flex: '1', minWidth: '150px' }}
          >
            {creating ? (
              <div className="flex align-center justify-center">
                <div className="spinner" style={{ width: '16px', height: '16px', marginRight: '0.5rem' }}></div>
                Creating...
              </div>
            ) : (
              '₿ Create Bitcoin Wallet'
            )}
          </button>
          
          <button
            onClick={() => createWallet(CryptoCurrency.USDT_TRC20)}
            disabled={creating}
            className="btn btn-secondary"
            style={{ flex: '1', minWidth: '150px' }}
          >
            {creating ? (
              <div className="flex align-center justify-center">
                <div className="spinner" style={{ width: '16px', height: '16px', marginRight: '0.5rem' }}></div>
                Creating...
              </div>
            ) : (
              '💰 Create USDT Wallet'
            )}
          </button>
        </div>
      </div>

      {displayError && (
        <div className="alert alert-error">
          {displayError}
        </div>
      )}

      {/* Wallets List */}
      <div>
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : wallets.length === 0 ? (
          <div className="card text-center">
            <div style={{ padding: '2rem' }}>
              <h4 className="mb-3">No wallets found</h4>
              <p className="text-muted">Create your first wallet above to get started!</p>
            </div>
          </div>
        ) : (
          wallets.map(wallet => (
            <div
              key={wallet.id}
              className="wallet-card"
              onClick={() => onWalletSelect(wallet)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: '1', minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>
                      {wallet.currency === CryptoCurrency.BITCOIN ? '₿' : '💰'}
                    </span>
                    <h4 style={{ margin: '0', color: '#333' }}>
                      {getCurrencySymbol(wallet.currency)} Wallet
                    </h4>
                  </div>
                  
                  <div className="wallet-address mb-2">
                    <strong>Address:</strong> {wallet.address.length > 30 
                      ? `${wallet.address.substring(0, 15)}...${wallet.address.substring(wallet.address.length - 15)}`
                      : wallet.address
                    }
                  </div>
                  
                  <div className="wallet-balance">
                    {wallet.balance.toFixed(8)} {getCurrencySymbol(wallet.currency)}
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    refreshBalance(wallet.id);
                  }}
                  className="btn btn-primary btn-small"
                  style={{ alignSelf: 'flex-start' }}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WalletList;