import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Admin } from '../../types';
import AdminDashboard from './components/AdminDashboard';

// Reads the admin identity from localStorage. RoleGuard has already validated
// the entry exists and has role === 'ADMIN' before rendering this component.
function readAdmin(): Admin | null {
  const raw =
    localStorage.getItem('cryptoWalletAdmin') ||
    localStorage.getItem('cryptoWalletUser');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Admin;
  } catch {
    return null;
  }
}

function AdminHome() {
  const navigate = useNavigate();
  const currentAdmin = readAdmin();

  const handleLogout = () => {
    localStorage.removeItem('cryptoWalletAdmin');
    localStorage.removeItem('cryptoWalletUser');
    navigate('/');
  };

  if (!currentAdmin) {
    return null;
  }

  return <AdminDashboard currentAdmin={currentAdmin} onLogout={handleLogout} />;
}

export default AdminHome;
