import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RoleGuard } from '../RoleGuard';

function renderGuard(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <RoleGuard role="ADMIN">
              <div data-testid="admin-children">admin content</div>
            </RoleGuard>
          }
        />
        <Route path="/" element={<div data-testid="home-route">home</div>} />
        <Route path="/signin" element={<div data-testid="signin-route">signin</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('RoleGuard', () => {
  test('redirects to /signin when no auth entry is in localStorage', () => {
    renderGuard('/admin');
    expect(screen.getByTestId('signin-route')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-children')).not.toBeInTheDocument();
  });

  test('redirects to / when stored user has role USER and ADMIN is required', () => {
    localStorage.setItem(
      'cryptoWalletUser',
      JSON.stringify({ id: 1, username: 'u', role: 'USER' }),
    );
    renderGuard('/admin');
    expect(screen.getByTestId('home-route')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-children')).not.toBeInTheDocument();
  });

  test('renders children when stored user has role ADMIN', () => {
    localStorage.setItem(
      'cryptoWalletAdmin',
      JSON.stringify({ id: 2, username: 'admin', role: 'ADMIN' }),
    );
    renderGuard('/admin');
    expect(screen.getByTestId('admin-children')).toBeInTheDocument();
  });
});
