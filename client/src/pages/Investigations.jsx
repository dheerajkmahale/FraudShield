import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/Badges';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import Pagination from '../components/Pagination';
import { useApi } from '../hooks/useApi';
import { investigationService } from '../services';
import { useAuth } from '../context/AuthContext';
import { formatDate, titleCase } from '../utils/format';

const STATUSES = ['open', 'under_investigation', 'escalated', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function NewInvestigationModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await investigationService.create(form);
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create investigation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="New Investigation" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Priority</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="field-error">{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Investigation'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Investigations() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, loading, error, refetch } = useApi(
    () => investigationService.list({ page, limit: 15, status: status || undefined }),
    [page, status]
  );

  return (
    <AppLayout title="Investigations">
      <div className="card">
        <div className="card-header">
          <h3>Case List</h3>
          {hasRole('admin', 'investigator') && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + New Investigation
            </button>
          )}
        </div>

        <div className="filters-bar">
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </select>
        </div>

        {loading && <LoadingState label="Loading investigations..." />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && data.data.length === 0 && <EmptyState message="No investigations found." />}
        {!loading && !error && data.data.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Title</th>
                    <th>Assigned To</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((inv) => (
                    <tr key={inv._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/investigations/${inv._id}`)}>
                      <td>{inv.caseId}</td>
                      <td>{inv.title}</td>
                      <td>{inv.assignedTo?.name || 'Unassigned'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{inv.priority}</td>
                      <td>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td>{formatDate(inv.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPageChange={setPage} />
          </>
        )}
      </div>

      {showForm && (
        <NewInvestigationModal
          onClose={() => setShowForm(false)}
          onCreated={(inv) => navigate(`/investigations/${inv._id}`)}
        />
      )}
    </AppLayout>
  );
}
