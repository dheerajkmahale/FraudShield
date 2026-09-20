import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('fraudshield_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // On mount, if a token exists, verify it's still valid and refresh the user.
  useEffect(() => {
    const token = localStorage.getItem('fraudshield_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .me()
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('fraudshield_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('fraudshield_token');
        localStorage.removeItem('fraudshield_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password });
    localStorage.setItem('fraudshield_token', res.data.token);
    localStorage.setItem('fraudshield_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authService.register(payload);
    localStorage.setItem('fraudshield_token', res.data.token);
    localStorage.setItem('fraudshield_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore network errors on logout; clear local session regardless
    }
    localStorage.removeItem('fraudshield_token');
    localStorage.removeItem('fraudshield_user');
    setUser(null);
  }, []);

  const hasRole = useCallback((...roles) => !!user && roles.includes(user.role), [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
