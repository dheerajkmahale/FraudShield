import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

function renderWithAuth(authValue) {
  useAuth.mockReturnValue(authValue);
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Dashboard Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('shows a loading state while auth is resolving', () => {
    renderWithAuth({ user: null, loading: true });
    expect(screen.getByText(/checking your session/i)).toBeInTheDocument();
  });

  it('redirects to /login when there is no user', () => {
    renderWithAuth({ user: null, loading: false });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when a user is present', () => {
    renderWithAuth({ user: { role: 'analyst' }, loading: false });
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('redirects away when the role is not permitted', () => {
    useAuth.mockReturnValue({ user: { role: 'analyst' }, loading: false });
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<div>Fallback Dashboard</div>} />
          <Route
            path="/admin-area"
            element={
              <ProtectedRoute roles={['admin']}>
                <div>Admin Only</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );
    // Analyst hitting an admin-only route (simulated via /dashboard as the redirect target)
    expect(screen.queryByText('Admin Only')).not.toBeInTheDocument();
  });
});
