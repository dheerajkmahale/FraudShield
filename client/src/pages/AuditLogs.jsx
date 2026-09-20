import React, { useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import Pagination from '../components/Pagination';
import { useApi } from '../hooks/useApi';
import { auditLogService } from '../services';
import { formatDate } from '../utils/format';

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');

  const { data, loading, error, refetch } = useApi(
    () => auditLogService.list({ page, limit: 20, action: action || undefined }),
    [page, action]
  );

  return (
    <AppLayout title="Audit Logs">
      <div className="card">
        <div className="card-header">
          <h3>System Activity Log</h3>
        </div>

        <div className="filters-bar">
          <input placeholder="Filter by action (e.g. LOGIN)" value={action} onChange={(e) => { setPage(1); setAction(e.target.value); }} />
        </div>

        {loading && <LoadingState label="Loading audit logs..." />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && data.data.length === 0 && <EmptyState message="No audit log entries found." />}
        {!loading && !error && data.data.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Metadata</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((log) => (
                    <tr key={log._id}>
                      <td>{log.user?.name || 'System'}</td>
                      <td><span className="badge badge-neutral">{log.action}</span></td>
                      <td>{log.resource}</td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {log.metadata && Object.keys(log.metadata).length > 0 ? JSON.stringify(log.metadata) : '-'}
                      </td>
                      <td>{formatDate(log.createdAt)}</td>
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
