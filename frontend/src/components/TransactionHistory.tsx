import React, { useState, useEffect } from 'react';
import { transactionApi } from '../services/api';
import { Transaction, TransactionType, TransactionStatus } from '../types';

interface TransactionHistoryProps {
  walletId?: number;
  userId?: number;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ walletId, userId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [walletId, userId]);

  const loadTransactions = async () => {
    if (!walletId && !userId) return;
    
    setLoading(true);
    try {
      let txns: Transaction[];
      if (walletId) {
        txns = await transactionApi.getWalletTransactions(walletId);
      } else if (userId) {
        txns = await transactionApi.getUserTransactions(userId);
      } else {
        txns = [];
      }
      setTransactions(txns);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.CONFIRMED:
        return '#28a745';
      case TransactionStatus.PENDING:
        return '#ffc107';
      case TransactionStatus.FAILED:
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getTypeIcon = (type: TransactionType) => {
    return type === TransactionType.SEND ? '↗️' : '↘️';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
  };

  if (loading) {
    return <div>Loading transactions...</div>;
  }

  return (
    <div>
      <h3 className="text-xl mb-4" style={{ color: '#667eea' }}>
        📊 Transaction History
      </h3>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="card text-center">
          <div style={{ padding: '2rem' }}>
            <h4 className="mb-3">No transactions found</h4>
            <p className="text-muted">Your transaction history will appear here once you start sending or receiving crypto.</p>
          </div>
        </div>
      ) : (
        <div>
          {transactions.map(transaction => (
            <div key={transaction.id} className="transaction-card">
              <div className="transaction-header">
                <div className="transaction-type">
                  <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>
                    {getTypeIcon(transaction.type)}
                  </span>
                  <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>
                    {transaction.type.toLowerCase()}
                  </span>
                  <span 
                    className={`transaction-status ${
                      transaction.status === TransactionStatus.CONFIRMED ? 'status-confirmed' :
                      transaction.status === TransactionStatus.PENDING ? 'status-pending' : 'status-failed'
                    }`}
                  >
                    {transaction.status}
                  </span>
                </div>
                
                <div className="text-small text-muted">
                  {formatDate(transaction.createdAt)}
                </div>
              </div>
              
              <div className="transaction-amount mb-3">
                {transaction.amount.toFixed(8)}
                {transaction.fee && (
                  <span className="text-small text-muted" style={{ marginLeft: '1rem' }}>
                    Fee: {transaction.fee.toFixed(8)}
                  </span>
                )}
              </div>
              
              <div className="text-small text-muted mb-2">
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>From:</strong> {formatAddress(transaction.fromAddress)}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>To:</strong> {formatAddress(transaction.toAddress)}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>TX Hash:</strong> {formatAddress(transaction.txHash)}
                </div>
              </div>
              
              {transaction.memo && (
                <div className="text-small mb-2">
                  <strong>Memo:</strong> {transaction.memo}
                </div>
              )}
              
              {transaction.blockNumber && (
                <div className="text-small text-muted">
                  <strong>Block:</strong> {transaction.blockNumber}
                  {transaction.confirmations && (
                    <span style={{ marginLeft: '1rem' }}>
                      <strong>Confirmations:</strong> {transaction.confirmations}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="text-center mt-4">
        <button
          onClick={loadTransactions}
          className="btn btn-secondary"
        >
          🔄 Refresh Transactions
        </button>
      </div>
    </div>
  );
};

export default TransactionHistory;