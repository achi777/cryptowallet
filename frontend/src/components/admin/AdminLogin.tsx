import React, { useState } from 'react';
import { Admin, AdminLogin as AdminLoginType } from '../../types';
import { adminAuthApi } from '../../services/adminApi';

interface AdminLoginProps {
  onLoginSuccess: (admin: Admin) => void;
  onBackToUser?: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToUser }) => {
  const [formData, setFormData] = useState<AdminLoginType>({
    username: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await adminAuthApi.login(formData);
      if (response.success && response.admin) {
        onLoginSuccess(response.admin);
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="card w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#667eea' }}>
            🔐 Admin Portal
          </h1>
          <p className="text-muted">
            Access the administrative dashboard
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter admin username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? '🔄 Signing In...' : '🚪 Sign In'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-muted">
            Authorized personnel only
          </p>
          {onBackToUser && (
            <button
              type="button"
              onClick={onBackToUser}
              className="text-secondary mt-2"
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.875rem'
              }}
            >
              ← Back to User Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;