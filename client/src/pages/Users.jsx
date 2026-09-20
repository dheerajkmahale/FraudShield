import React, { useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import { LoadingState, ErrorState } from '../components/States';
import Pagination from '../components/Pagination';
import { useApi } from '../hooks/useApi';
import { userService } from '../services';
import { formatDate, titleCase } from '../utils/format';

const ROLES = ['admin', 'investigator', 'analyst'];

export default function Users() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  const { data, loading, error, refetch } = useApi(
    () => userService.list({ page, limit: 15, search: search || undefined, role: role || undefined }),
    [page, search, role]
  );

  const handleRoleChange = async (id, newRole) => {
    await userService.updateRole(id, newRole);
    refetch();
  };

  const handleStatusToggle = async (id, isActive) => {
    await userService.updateStatus(id, !isActive);
    refetch();
  };

  return (
    <AppLayout title="User Management">
      <div className="card">
        <div className="card-header">
          <h3>Platform Users</h3>
        </div>

        <div className="filters-bar">
          <input
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <select
            value={role}
            onChange={(e) => {
              setPage(1);
              setRole(e.target.value);
            }}
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {titleCase(r)}
              </option>
            ))}
          </select>
        </div>

        {loading && <LoadingState label="Loading users..." />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((u) => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)} style={{ width: 'auto' }}>
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {titleCase(r)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td>{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => handleStatusToggle(u._id, u.isActive)}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPageChange={setPage} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
