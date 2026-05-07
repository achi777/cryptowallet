import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { UnifiedLoginCredentials } from '../types';

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UnifiedLoginCredentials>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.signIn(formData);
      if (response.success && response.user) {
        if (response.user.role === 'ADMIN') {
          localStorage.setItem('cryptoWalletAdmin', JSON.stringify(response.user));
          navigate('/admin');
        } else {
          localStorage.setItem('cryptoWalletUser', JSON.stringify(response.user));
          navigate('/');
        }
      } else {
        setError(response.message || 'Sign-in failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="flex justify-center align-center" style={{ minHeight: '100vh', padding: '2rem 0' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
          <div className="text-center mb-4">
            <h1 className="text-2xl mb-2" style={{ color: '#667eea', fontWeight: '700' }}>
              🔐 Crypto Wallet
            </h1>
            <p className="text-muted">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formData.email || !formData.password}
              className="btn btn-primary btn-full mb-3"
            >
              {loading ? (
                <div className="flex align-center justify-center">
                  <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '0.5rem' }}></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
