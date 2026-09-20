import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { formatDate } from '../utils/format';

export default function Topbar({ title }) {
  const { logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-actions">
        <div style={{ position: 'relative' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setOpen((o) => !o)}>
            🔔 {unreadCount > 0 ? unreadCount : ''}
          </button>
          {open && (
            <div className="notif-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <strong style={{ fontSize: 13 }}>Notifications</strong>
                <button className="btn btn-outline btn-sm" onClick={markAllAsRead}>
                  Mark all read
                </button>
              </div>
              {notifications.length === 0 && <div className="notif-item">No notifications yet.</div>}
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className={`notif-item${n.isRead ? '' : ' unread'}`}
                  onClick={() => !n.isRead && markAsRead(n._id)}
                  style={{ cursor: n.isRead ? 'default' : 'pointer' }}
                >
                  {n.message}
                  <div className="notif-meta">{formatDate(n.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}
