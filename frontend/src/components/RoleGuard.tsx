import React from 'react';
import { Navigate } from 'react-router-dom';

export type RoleGuardProps = {
  role: 'ADMIN' | 'USER';
  children: React.ReactNode;
};

// CRYPTOWALL-5 collapsed Admin into the User type, but the existing UI still
// stores the admin session under `cryptoWalletAdmin` and the user session
// under `cryptoWalletUser`. We read either key and gate on the `role` field
// of the parsed identity for backward compatibility.
export function RoleGuard({ role, children }: RoleGuardProps) {
  const stored =
    localStorage.getItem('cryptoWalletAdmin') ||
    localStorage.getItem('cryptoWalletUser');
  if (!stored) return <Navigate to="/signin" replace />;
  try {
    const user = JSON.parse(stored);
    if (role === 'ADMIN' && user.role !== 'ADMIN') {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  } catch {
    localStorage.removeItem('cryptoWalletAdmin');
    localStorage.removeItem('cryptoWalletUser');
    return <Navigate to="/signin" replace />;
  }
}

export default RoleGuard;
