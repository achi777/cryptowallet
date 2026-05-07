import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';
import UserRegistrationForm from '../components/UserRegistration';
import WalletList from '../components/WalletList';
import TransactionForm from '../components/TransactionForm';
import TransactionHistory from '../components/TransactionHistory';
import { Wallet, User } from '../types';

function Home() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [activeTab, setActiveTab] = useState<'wallets' | 'send' | 'history'>('wallets');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const storedUser = localStorage.getItem('cryptoWalletUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('cryptoWalletUser');
      }
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('cryptoWalletUser', JSON.stringify(user));
  };

  const handleRegistrationSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('cryptoWalletUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedWallet(null);
    setActiveTab('wallets');
    localStorage.removeItem('cryptoWalletUser');
    setAuthMode('login');
  };

  const handleWalletSelect = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setActiveTab('send');
  };

  const handleTransactionSent = () => {
    setActiveTab('wallets');
    setSelectedWallet(null);
  };

  if (!currentUser) {
    if (authMode === 'login') {
      return (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setAuthMode('register')}
          onSwitchToAdmin={() => navigate('/admin/login')}
        />
      );
    }
    return (
      <UserRegistrationForm
        onRegistrationSuccess={handleRegistrationSuccess}
        onSwitchToLogin={() => setAuthMode('login')}
      />
    );
  }

  return (
    <div className="App">
      <nav className="nav">
        <div className="container">
          <div className="nav-content">
            <div className="nav-brand">💰 Crypto Wallet</div>

            <div className="nav-menu">
              <button
                onClick={() => {
                  setActiveTab('wallets');
                  setSelectedWallet(null);
                }}
                className={`btn ${activeTab === 'wallets' ? 'btn-primary' : 'btn-secondary'} btn-small`}
              >
                📱 Wallets
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'} btn-small`}
              >
                📊 History
              </button>

              <button onClick={handleLogout} className="btn btn-danger btn-small">
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container">
        <div className="card text-center mb-4">
          <h1 className="text-2xl mb-2" style={{ color: '#667eea' }}>
            Welcome back, {currentUser.firstName}! 👋
          </h1>
          <p className="text-muted">Manage your crypto wallets and transactions</p>
        </div>

        {activeTab === 'wallets' && (
          <WalletList userId={currentUser.id} onWalletSelect={handleWalletSelect} />
        )}

        {activeTab === 'send' && selectedWallet && (
          <div>
            <div className="card">
              <button onClick={() => setActiveTab('wallets')} className="btn btn-secondary mb-3">
                ← Back to Wallets
              </button>
              <TransactionForm wallet={selectedWallet} onTransactionSent={handleTransactionSent} />
            </div>
          </div>
        )}

        {activeTab === 'history' && <TransactionHistory userId={currentUser.id} />}
      </main>
    </div>
  );
}

export default Home;
