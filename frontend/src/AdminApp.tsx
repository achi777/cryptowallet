import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/globals.css';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import { Admin } from './types';

function AdminApp() {
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);

  // Check for stored admin session on app load
  useEffect(() => {
    const storedAdmin = localStorage.getItem('cryptoWalletAdmin');
    if (storedAdmin) {
      try {
        setCurrentAdmin(JSON.parse(storedAdmin));
      } catch (error) {
        localStorage.removeItem('cryptoWalletAdmin');
      }
    }
  }, []);

  const handleLoginSuccess = (admin: Admin) => {
    setCurrentAdmin(admin);
    localStorage.setItem('cryptoWalletAdmin', JSON.stringify(admin));
  };

  const handleLogout = () => {
    setCurrentAdmin(null);
    localStorage.removeItem('cryptoWalletAdmin');
  };

  // Authentication screen
  if (!currentAdmin) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Main admin dashboard
  return (
    <AdminDashboard 
      currentAdmin={currentAdmin} 
      onLogout={handleLogout} 
    />
  );
}

export default AdminApp;