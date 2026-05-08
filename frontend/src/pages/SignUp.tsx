import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

interface SignUpFormState {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_FORM: SignUpFormState = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mirror of SignIn.tsx's formatSignInError — kept here as a small dedicated copy
// so the two pages don't grow a shared module just for one helper. If the catch
// behavior diverges later (e.g. registration adds a 409 path), each page is free
// to evolve independently.
function formatRegisterError(err: any): string {
  if (!err || typeof err !== 'object') {
    return 'Sign-up failed. Please try again.';
  }
  if (!err.response) {
    return 'Cannot reach the server. Check your connection and try again.';
  }
  const { status, data } = err.response;
  if (data?.message && typeof data.message === 'string') {
    return data.message;
  }
  if (status >= 500) {
    return `Server error (${status}) — please try again or contact support.`;
  }
  return `Sign-up failed (${status}).`;
}

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignUpFormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = (): string | null => {
    if (!formData.firstName.trim()) return 'First name is required.';
    if (!formData.lastName.trim()) return 'Last name is required.';
    const username = formData.username.trim();
    if (!username) return 'Username is required.';
    if (username.length < 3 || username.length > 50) {
      return 'Username must be between 3 and 50 characters.';
    }
    const email = formData.email.trim();
    if (!email) return 'Email is required.';
    if (!EMAIL_RE.test(email)) return 'Please enter a valid email address.';
    if (!formData.password) return 'Password is required.';
    if (formData.password.length < 8) return 'Password must be at least 8 characters.';
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const passwordsMismatch =
    formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const email = formData.email.trim();
    const username = formData.username.trim();
    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      username,
      email,
      password: formData.password,
    };

    setLoading(true);
    try {
      const registerResponse = await authApi.register(payload);
      if (!registerResponse.success) {
        setError(registerResponse.message || 'Sign-up failed.');
        return;
      }

      setInfo('Account created — signing you in…');
      const signInResponse = await authApi.signIn({ email, password: formData.password });
      if (signInResponse.success && signInResponse.user) {
        if (signInResponse.user.role === 'ADMIN') {
          localStorage.setItem('cryptoWalletAdmin', JSON.stringify(signInResponse.user));
          navigate('/admin');
        } else {
          localStorage.setItem('cryptoWalletUser', JSON.stringify(signInResponse.user));
          navigate('/');
        }
      } else {
        // Account exists but signin failed — surface a precise message and let
        // the user retry from /signin rather than silently dropping them.
        setInfo(null);
        setError(
          signInResponse.message ||
            'Account created, but automatic sign-in failed. Please sign in manually.',
        );
      }
    } catch (err: any) {
      setInfo(null);
      setError(formatRegisterError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="flex justify-center align-center" style={{ minHeight: '100vh', padding: '2rem 0' }}>
        <div className="card" style={{ width: '100%', maxWidth: '440px' }}>
          <div className="text-center mb-4">
            <h1 className="text-2xl mb-2" style={{ color: '#667eea', fontWeight: '700' }}>
              🔐 Crypto Wallet
            </h1>
            <p className="text-muted">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">
                First name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="form-input"
                placeholder="Ada"
                required
                autoComplete="given-name"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lastName">
                Last name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="form-input"
                placeholder="Lovelace"
                required
                autoComplete="family-name"
              />
            </div>

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
                placeholder="ada"
                minLength={3}
                maxLength={50}
                required
                autoComplete="username"
              />
            </div>

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
                placeholder="At least 8 characters"
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="Re-enter your password"
                minLength={8}
                required
                autoComplete="new-password"
                aria-invalid={passwordsMismatch || undefined}
                aria-describedby={passwordsMismatch ? 'confirm-password-error' : undefined}
              />
              {passwordsMismatch && (
                <div
                  id="confirm-password-error"
                  className="text-muted"
                  style={{ color: '#c0392b', fontSize: '0.85rem', marginTop: '0.25rem' }}
                >
                  Passwords do not match.
                </div>
              )}
            </div>

            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}

            {info && !error && (
              <div className="alert" role="status">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full mb-3"
            >
              {loading ? (
                <div className="flex align-center justify-center">
                  <div
                    className="spinner"
                    style={{ width: '20px', height: '20px', marginRight: '0.5rem' }}
                  ></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="text-center text-muted" style={{ fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/signin" style={{ color: '#667eea', fontWeight: 600 }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
