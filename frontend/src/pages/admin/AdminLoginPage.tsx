import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Admin } from '../../types';
import AdminLogin from './components/AdminLogin';

function AdminLoginPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = (admin: Admin) => {
    localStorage.setItem('cryptoWalletAdmin', JSON.stringify(admin));
    navigate('/admin');
  };

  return (
    <AdminLogin
      onLoginSuccess={handleLoginSuccess}
      onBackToUser={() => navigate('/')}
    />
  );
}

export default AdminLoginPage;
