import React from 'react';
import { SystemStats } from '../../types';

interface AdminStatsProps {
  stats: SystemStats | null;
  loading: boolean;
  onRefresh: () => void;
}

const AdminStats: React.FC<AdminStatsProps> = ({ stats, loading, onRefresh }) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">🔄 Loading system statistics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card text-center">
        <div className="text-lg mb-4">❌ Failed to load system statistics</div>
        <button onClick={onRefresh} className="btn btn-primary">
          🔄 Retry
        </button>
      </div>
    );
  }

  const StatCard: React.FC<{ title: string; value: number | string; icon: string; color?: string }> = 
    ({ title, value, icon, color = '#667eea' }) => (
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold" style={{ color }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            <div className="text-sm text-muted">{title}</div>
          </div>
          <div className="text-3xl">{icon}</div>
        </div>
      </div>
    );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">System Overview</h2>
        <button onClick={onRefresh} className="btn btn-secondary btn-small">
          🔄 Refresh
        </button>
      </div>

      {/* User Statistics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">👥 User Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Users" value={stats.totalUsers} icon="👥" />
          <StatCard title="Active Users" value={stats.activeUsers} icon="✅" color="#10b981" />
          <StatCard title="Registered Today" value={stats.usersRegisteredToday} icon="📅" color="#f59e0b" />
        </div>
      </div>

      {/* Wallet Statistics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">💼 Wallet Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Wallets" value={stats.totalWallets} icon="💼" />
          <StatCard title="Bitcoin Wallets" value={stats.bitcoinWallets} icon="₿" color="#f7931a" />
          <StatCard title="USDT Wallets" value={stats.usdtWallets} icon="💵" color="#26a17b" />
        </div>
      </div>

      {/* Transaction Statistics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">📈 Transaction Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Transactions" value={stats.totalTransactions} icon="📊" />
          <StatCard title="Pending" value={stats.pendingTransactions} icon="⏳" color="#f59e0b" />
          <StatCard title="Confirmed" value={stats.confirmedTransactions} icon="✅" color="#10b981" />
          <StatCard title="Failed" value={stats.failedTransactions} icon="❌" color="#ef4444" />
        </div>
      </div>

      {/* Volume Statistics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">💰 Trading Volume</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Total BTC Volume" 
            value={`${stats.totalBitcoinVolume.toFixed(8)} BTC`} 
            icon="₿" 
            color="#f7931a" 
          />
          <StatCard 
            title="Total USDT Volume" 
            value={`${stats.totalUsdtVolume.toFixed(2)} USDT`} 
            icon="💵" 
            color="#26a17b" 
          />
          <StatCard 
            title="Transactions Today" 
            value={stats.transactionsToday} 
            icon="📅" 
            color="#8b5cf6" 
          />
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">📋 Activity Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Today's Activity</h4>
            <ul className="space-y-2 text-sm">
              <li>• {stats.usersRegisteredToday} new user registrations</li>
              <li>• {stats.transactionsToday} transactions processed</li>
              <li>• {stats.pendingTransactions} pending transactions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">System Health</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${stats.pendingTransactions < 10 ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                Transaction Queue: {stats.pendingTransactions < 10 ? 'Normal' : 'High'}
              </li>
              <li className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${stats.failedTransactions < stats.totalTransactions * 0.05 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                Failure Rate: {((stats.failedTransactions / stats.totalTransactions) * 100).toFixed(2)}%
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 rounded-full mr-2 bg-green-500"></span>
                System Status: Online
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;