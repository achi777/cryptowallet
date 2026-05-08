import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { UnifiedLoginCredentials } from '../types';

// Map an axios-style error onto a user-readable string. The previous catch
// collapsed everything (network down, 5xx, 4xx-with-no-body) onto "Invalid
// email or password", which misled users with valid credentials when the
// backend was simply unreachable.
function formatSignInError(err: any): string {
  if (!err || typeof err !== 'object') {
    return 'Sign-in failed. Please try again.';
  }
  if (!err.response) {
    return 'Cannot reach the server. Check your connection and try again.';
  }
  const { status, data } = err.response;
  if (data?.message && typeof data.message === 'string') {
    return data.message;
  }
  if (status === 401 || status === 403) {
    return 'Invalid email or password.';
  }
  if (status >= 500) {
    return `Server error (${status}) — please try again or contact support.`;
  }
  return `Sign-in failed (${status}).`;
}

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UnifiedLoginCredentials>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Trim whitespace from email — backend already lowercases for comparison,
    // but a stray leading/trailing space would cause an unnecessary 401 because
    // the trimmed bootstrap-seeded email never has spaces.
    const payload: UnifiedLoginCredentials = {
      email: formData.email.trim(),
      password: formData.password,
    };

    try {
      const response = await authApi.signIn(payload);
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
      setError(formatSignInError(err));
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

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowHelp(s => !s)}
              aria-expanded={showHelp}
              aria-controls="signin-help"
              className="text-muted"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.875rem',
              }}
            >
              Trouble signing in?
            </button>
            {showHelp && (
              <div
                id="signin-help"
                className="alert"
                style={{ textAlign: 'left', marginTop: '0.75rem', fontSize: '0.875rem' }}
              >
                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                  <li>Make sure your URL ends in <code>/signin</code> (not <code>/admin/login</code>).</li>
                  <li>Use your <strong>email</strong> (e.g. <code>admin@cryptowall.local</code>), not your username.</li>
                  <li>If your credentials come from <code>ADMIN_CREDENTIALS.md</code>, copy them carefully — leading or trailing spaces will cause failures.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
