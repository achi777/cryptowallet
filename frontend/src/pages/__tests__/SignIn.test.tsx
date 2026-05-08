import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// axios v1 ships as ESM and Jest's CRA preset can't parse it; SignIn calls
// authApi.signIn, which we intercept with a spy below.
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    }),
  },
}));

import SignIn from '../SignIn';
import { authApi } from '../../services/api';

function renderSignIn() {
  return render(
    <MemoryRouter initialEntries={['/signin']}>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/admin" element={<div data-testid="admin-route">admin landed</div>} />
        <Route path="/" element={<div data-testid="home-route">home landed</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

describe('SignIn page', () => {
  test('navigates to /admin and persists session for an ADMIN response', async () => {
    const spy = jest.spyOn(authApi, 'signIn').mockResolvedValue({
      success: true,
      message: 'Sign-in successful',
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@cryptowall.local',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        active: true,
        wallets: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    });

    renderSignIn();

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@cryptowall.local');
    await userEvent.type(screen.getByLabelText(/password/i), 'super-secret');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByTestId('admin-route')).toBeInTheDocument());
    expect(spy).toHaveBeenCalledWith({ email: 'admin@cryptowall.local', password: 'super-secret' });
    expect(localStorage.getItem('cryptoWalletAdmin')).not.toBeNull();
  });

  test('trims surrounding whitespace from the email before submitting', async () => {
    // CRYPTOWALL-18: paste-from-docs frequently includes a stray space. The form
    // should clean that up so users don't see "Invalid email or password" with
    // otherwise-correct credentials.
    const spy = jest.spyOn(authApi, 'signIn').mockResolvedValue({
      success: true,
      message: 'Sign-in successful',
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@cryptowall.local',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        active: true,
        wallets: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    });

    renderSignIn();

    await userEvent.type(screen.getByLabelText(/email/i), '  admin@cryptowall.local  ');
    await userEvent.type(screen.getByLabelText(/password/i), 'super-secret');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(spy).toHaveBeenCalledWith({ email: 'admin@cryptowall.local', password: 'super-secret' });
  });

  test('shows a network-error message when the API is unreachable', async () => {
    // Axios surfaces "no response" as an error with no `response` field. The previous
    // catch collapsed this onto "Invalid email or password", misleading users when the
    // backend was down. The fix branches on `err.response`.
    jest.spyOn(authApi, 'signIn').mockRejectedValue(new Error('Network Error'));

    renderSignIn();

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@cryptowall.local');
    await userEvent.type(screen.getByLabelText(/password/i), 'super-secret');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/cannot reach the server/i),
    );
  });

  test('shows a server-error message including the status code on 5xx', async () => {
    jest.spyOn(authApi, 'signIn').mockRejectedValue({
      response: { status: 502, data: undefined },
    });

    renderSignIn();

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@cryptowall.local');
    await userEvent.type(screen.getByLabelText(/password/i), 'super-secret');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/server error \(502\)/i));
  });

  test('shows "Invalid email or password" on a 401 with no body', async () => {
    jest.spyOn(authApi, 'signIn').mockRejectedValue({
      response: { status: 401, data: undefined },
    });

    renderSignIn();

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@cryptowall.local');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid email or password/i),
    );
  });

  test('"Trouble signing in?" toggle reveals the help panel', async () => {
    renderSignIn();
    const toggle = screen.getByRole('button', { name: /trouble signing in/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    // Help text mentions /signin and the legacy /admin/login URL — pinpoint the
    // expandable panel by ID so the matcher doesn't ambiguously match parents.
    const helpPanel = document.getElementById('signin-help');
    expect(helpPanel).not.toBeNull();
    expect(helpPanel!.textContent).toMatch(/\/signin/);
    expect(helpPanel!.textContent).toMatch(/\/admin\/login/);
  });
});
