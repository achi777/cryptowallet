import React, { useState, useEffect } from 'react';
import { Admin, SystemStats } from '../../types';
import { adminDashboardApi } from '../../services/adminApi';
import AdminStats from './AdminStats';
import UserManagement from './UserManagement';
import WalletManagement from './WalletManagement';
import TransactionManagement from './TransactionManagement';
import AdminSettings from './AdminSettings';

interface AdminDashboardProps {
  currentAdmin: Admin;
  onLogout: () => void;
}

type ActiveTab = 'dashboard' | 'users' | 'wallets' | 'transactions' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentAdmin, onLogout }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const systemStats = await adminDashboardApi.getStats();
      setStats(systemStats);
    } catch (error) {
      console.error('Failed to load system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminStats stats={stats} loading={loading} onRefresh={loadStats} />;
      case 'users':
        return <UserManagement />;
      case 'wallets':
        return <WalletManagement />;
      case 'transactions':
        return <TransactionManagement />;
      case 'settings':
        return <AdminSettings currentAdmin={currentAdmin} />;
      default:
        return <AdminStats stats={stats} loading={loading} onRefresh={loadStats} />;
    }
  };

  const getTabButtonClass = (tab: ActiveTab) => {
    return `btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'} btn-small`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="nav bg-white shadow-sm">
        <div className="container">
          <div className="nav-content">
            <div className="nav-brand">
              🛡️ Admin Dashboard
            </div>
            
            <div className="nav-menu">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={getTabButtonClass('dashboard')}
              >
                📊 Dashboard
              </button>
              
              <button
                onClick={() => setActiveTab('users')}
                className={getTabButtonClass('users')}
              >
                👥 Users
              </button>
              
              <button
                onClick={() => setActiveTab('wallets')}
                className={getTabButtonClass('wallets')}
              >
                💼 Wallets
              </button>
              
              <button
                onClick={() => setActiveTab('transactions')}
                className={getTabButtonClass('transactions')}
              >
                📈 Transactions
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className={getTabButtonClass('settings')}
              >
                ⚙️ Settings
              </button>
              
              <div className="dropdown">
                <button className="btn btn-secondary btn-small dropdown-toggle">
                  👤 {currentAdmin.firstName} {currentAdmin.lastName}
                </button>
                <div className="dropdown-menu">
                  <div className="dropdown-item">
                    <small className="text-muted">Role: {currentAdmin.role}</small>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button onClick={onLogout} className="dropdown-item text-danger">
                    🚪 Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="container py-4">
        {/* Welcome header */}
        <div className="card text-center mb-4">
          <h1 className="text-2xl mb-2" style={{ color: '#667eea' }}>
            Welcome, {currentAdmin.firstName}! 👋
          </h1>
          <p className="text-muted">
            Administrative Dashboard - {currentAdmin.role.replace('_', ' ')}
          </p>
          {stats && (
            <div className="text-sm text-muted mt-2">
              Last updated: {new Date(stats.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>

        {/* Tab content */}
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;