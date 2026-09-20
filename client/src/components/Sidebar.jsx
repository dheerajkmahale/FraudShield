import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'investigator', 'analyst'] },
  { to: '/transactions', label: 'Transactions', icon: '💳', roles: ['admin', 'investigator', 'analyst'] },
  { to: '/investigations', label: 'Investigations', icon: '🔎', roles: ['admin', 'investigator'] },
  { to: '/network', label: 'Network View', icon: '🕸️', roles: ['admin', 'investigator', 'analyst'] },
  { to: '/users', label: 'User Management', icon: '👥', roles: ['admin'] },
  { to: '/audit-logs', label: 'Audit Logs', icon: '📜', roles: ['admin'] },
  { to: '/profile', label: 'My Profile', icon: '⚙️', roles: ['admin', 'investigator', 'analyst'] },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="badge-shield">🛡</span> FraudShield
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.filter((item) => item.roles.includes(user?.role)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span>{item.icon}</span> {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        Signed in as<br />
        <strong>{user?.name}</strong> ({user?.role})
      </div>
    </aside>
  );
}
