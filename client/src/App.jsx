import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { LoadingState } from './components/States';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import Investigations from './pages/Investigations';
import InvestigationDetail from './pages/InvestigationDetail';
import NetworkView from './pages/NetworkView';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function RootRoute() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState label="Checking session..." />;
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<RootRoute />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions/:id"
        element={
          <ProtectedRoute>
            <TransactionDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/investigations"
        element={
          <ProtectedRoute roles={['admin', 'investigator']}>
            <Investigations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/investigations/:id"
        element={
          <ProtectedRoute roles={['admin', 'investigator']}>
            <InvestigationDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/network"
        element={
          <ProtectedRoute>
            <NetworkView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute roles={['admin']}>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute roles={['admin']}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
