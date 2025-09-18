import React, { useState } from 'react';
import { userApi } from '../services/api';
import { UserRegistration, User } from '../types';

interface UserRegistrationProps {
  onRegistrationSuccess: (user: User) => void;
  onSwitchToLogin: () => void;
}

const UserRegistrationForm: React.FC<UserRegistrationProps> = ({ onRegistrationSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState<UserRegistration>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await userApi.register(formData);
      if (response.success && response.user) {
        onRegistrationSuccess(response.user);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
              🚀 Join Crypto Wallet
            </h1>
            <p className="text-muted">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                placeholder="Choose a username"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your email"
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
                placeholder="Create a secure password"
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="firstName">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="form-input"
                placeholder="Your first name"
                required
                autoComplete="given-name"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lastName">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="form-input"
                placeholder="Your last name"
                required
                autoComplete="family-name"
              />
            </div>

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full mb-3"
            >
              {loading ? (
                <div className="flex align-center justify-center">
                  <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '0.5rem' }}></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="text-center">
              <p className="text-muted">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-primary"
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontWeight: '600'
                  }}
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserRegistrationForm;