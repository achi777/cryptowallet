import React, { useState } from 'react';
import { transactionApi } from '../services/api';
import { Wallet, SendTransaction, CryptoCurrency } from '../types';

interface TransactionFormProps {
  wallet: Wallet;
  onTransactionSent: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ wallet, onTransactionSent }) => {
  const [formData, setFormData] = useState<Omit<SendTransaction, 'walletId'>>({
    toAddress: '',
    amount: 0,
    memo: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const transaction = await transactionApi.send({
        ...formData,
        walletId: wallet.id
      });
      
      setSuccess(`Transaction sent successfully! TX Hash: ${transaction.txHash}`);
      setFormData({ toAddress: '', amount: 0, memo: '' });
      onTransactionSent();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Transaction failed');
    } finally {
      setLoading(false);
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

  return (
    <div>
      <h3 className="text-xl mb-4" style={{ color: '#667eea' }}>
        💸 Send {getCurrencySymbol(wallet.currency)}
      </h3>
      
      {/* Wallet Info Card */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
        <h4 className="mb-3">From Wallet</h4>
        <div className="wallet-address mb-2">
          <strong>Address:</strong> {wallet.address.length > 40 
            ? `${wallet.address.substring(0, 20)}...${wallet.address.substring(wallet.address.length - 20)}`
            : wallet.address
          }
        </div>
        <div className="wallet-balance">
          Available: {wallet.balance.toFixed(8)} {getCurrencySymbol(wallet.currency)}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="toAddress">
            Recipient Address
          </label>
          <input
            type="text"
            id="toAddress"
            name="toAddress"
            value={formData.toAddress}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter recipient wallet address"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="amount">
            Amount ({getCurrencySymbol(wallet.currency)})
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="form-input"
            placeholder="0.00000000"
            required
            min="0"
            step="0.00000001"
            max={wallet.balance}
          />
          <div className="text-small text-muted mt-1">
            Maximum: {wallet.balance.toFixed(8)} {getCurrencySymbol(wallet.currency)}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="memo">
            Memo (Optional)
          </label>
          <textarea
            id="memo"
            name="memo"
            value={formData.memo}
            onChange={handleChange}
            className="form-input form-textarea"
            placeholder="Add a note for this transaction (optional)"
          />
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || formData.amount <= 0 || formData.amount > wallet.balance}
          className={`btn btn-full ${
            loading || formData.amount <= 0 || formData.amount > wallet.balance 
              ? 'btn-secondary' 
              : 'btn-success'
          }`}
        >
          {loading ? (
            <div className="flex align-center justify-center">
              <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '0.5rem' }}></div>
              Sending Transaction...
            </div>
          ) : (
            `🚀 Send ${getCurrencySymbol(wallet.currency)}`
          )}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;