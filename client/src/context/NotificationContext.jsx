import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationService.list({ limit: 15 });
      setNotifications(res.data);
      setUnreadCount(res.meta?.unreadCount || 0);
    } catch {
      // silently ignore - notifications are non-critical
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }
    refresh();
    const interval = setInterval(refresh, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user, refresh]);

  const markAsRead = async (id) => {
    await notificationService.markAsRead(id);
    refresh();
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    refresh();
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
}
