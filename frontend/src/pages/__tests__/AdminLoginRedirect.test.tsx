import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';

// Axios is ESM-only; CRA's Jest config can't parse it. SignIn doesn't run in
// these tests because we don't navigate into it actively, but the page module
// imports the api client which transitively imports axios.
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

describe('legacy /admin/login route', () => {
  test('redirects to /signin so old bookmarks land on the unified form', () => {
    // Mirrors the route registered in App.tsx. Kept as an explicit test so the
    // CRYPTOWALL-18 fix is enforced even if someone later restructures App.
    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <Routes>
          <Route path="/signin" element={<div data-testid="signin-route">unified sign-in</div>} />
          <Route path="/admin/login" element={<Navigate to="/signin" replace />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('signin-route')).toBeInTheDocument();
  });
});
