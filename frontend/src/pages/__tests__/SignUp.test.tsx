import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Axios is ESM-only and CRA's Jest config can't transform it. SignUp imports
// services/api which transitively imports axios, so the bare import has to be
// stubbed before the component module is evaluated.
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

const mockRegister = jest.fn();
const mockSignIn = jest.fn();
jest.mock('../../services/api', () => ({
  authApi: {
    register: (...args: any[]) => mockRegister(...args),
    signIn: (...args: any[]) => mockSignIn(...args),
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import SignUp from '../SignUp';

function renderSignUp() {
  return render(
    <MemoryRouter>
      <SignUp />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockRegister.mockReset();
  mockSignIn.mockReset();
  mockNavigate.mockReset();
  localStorage.clear();
});

describe('SignUp page', () => {
  test('renders all six fields, submit button, and a sign-in link', () => {
    renderSignUp();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toHaveAttribute('href', '/signin');
  });

  test('submitting an empty form shows a validation error and does not call the API', () => {
    renderSignUp();
    // The form has noValidate + onSubmit handler; first failing field triggers
    // the inline error path (rather than browser-native validation popovers).
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent(/first name is required/i);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('mismatched confirm password shows the inline error', () => {
    renderSignUp();
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different1' } });
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test('valid submission calls authApi.register with the trimmed payload, then signs the user in', async () => {
    mockRegister.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      user: { id: 1, username: 'ada', email: 'ada@example.com', role: 'USER' },
    });
    mockSignIn.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      user: { id: 1, username: 'ada', email: 'ada@example.com', role: 'USER' },
    });

    renderSignUp();
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Lovelace' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'ada' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    expect(mockRegister).toHaveBeenCalledWith({
      firstName: 'Ada',
      lastName: 'Lovelace',
      username: 'ada',
      email: 'ada@example.com',
      password: 'password123',
    });

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledTimes(1));
    expect(mockSignIn).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'password123' });

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
    expect(localStorage.getItem('cryptoWalletUser')).not.toBeNull();
  });

  test('register failure surfaces the server error message', async () => {
    mockRegister.mockRejectedValueOnce({
      response: { status: 400, data: { message: 'Email already exists', success: false } },
    });

    renderSignUp();
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Lovelace' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'ada' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'taken@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/email already exists/i));
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
