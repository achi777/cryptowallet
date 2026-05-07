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
});
