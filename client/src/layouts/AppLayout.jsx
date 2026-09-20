import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function AppLayout({ title, children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar title={title} />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
