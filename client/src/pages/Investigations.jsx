import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { Modal } from '../components/Modal';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { ErrorState } from '../components/States';
import { TableSkeleton } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { useApi } from '../hooks/useApi';
import { investigationService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate, titleCase } from '../utils/format';

const STATUSES = ['open', 'under_investigation', 'escalated', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function NewInvestigationModal({ onClose, onCreated }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await investigationService.create(form);
      showToast(`Investigation created successfully: ${res.data?.caseId || form.title}`);
      onCreated(res.data);
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to create investigation';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="New Investigation" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            required
            placeholder="e.g. Unusual rapid transfers for ACC-0001"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            rows={3}
            placeholder="Document evidence, flagged transaction references, and initial suspicions..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Priority</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {titleCase(p)} Priority
              </option>
            ))}
          </select>
        </div>
        {error && <p className="field-error">{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
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

  const cases = data?.data || [];
  const totalCases = data?.meta?.total ?? cases.length;

  return (
    <AppLayout title="Investigations">
      <div className="card">
        {/* Header */}
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔎</span> Fraud Investigation Cases
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              Active triage queue, audit trails, and collaborative case resolutions
            </p>
          </div>
          {hasRole('admin', 'investigator') && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              + New Investigation
            </button>
          )}
        </div>

        {/* Compact Filter Toolbar */}
        <div className="table-toolbar">
          <select
            className="filter-select"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All Case Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </select>

          {status && (
            <button
              type="button"
              className="filter-reset-btn"
              onClick={() => {
                setStatus('');
                setPage(1);
              }}
              title="Reset status filter"
            >
              ✕ Reset status filter
            </button>
          )}

          <div className="results-count">
            {totalCases} {totalCases === 1 ? 'case' : 'cases'} {status ? `(${titleCase(status)})` : 'total'}
          </div>
        </div>

        {/* Loading State */}
        {loading && <TableSkeleton rows={8} />}

        {/* Error State */}
        {error && <ErrorState message={error} onRetry={refetch} />}

        {/* Styled Empty State */}
        {!loading && !error && cases.length === 0 && (
          <div className="empty-state" style={{ padding: '60px 20px', margin: '16px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔎</div>
            <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: 15 }}>
              {status ? `No ${titleCase(status)} Investigations` : 'No Investigations Found'}
            </h4>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 13, maxWidth: 440, marginInline: 'auto' }}>
              {status
                ? `There are currently zero cases marked as "${titleCase(status)}". Clear this filter to view all open and in-progress cases.`
                : 'No fraud investigations have been created yet. You can open a new case above to start documenting findings.'}
            </p>
            {status && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setStatus('');
                  setPage(1);
                }}
              >
                Clear status filter
              </button>
            )}
          </div>
        )}

        {/* Table Content */}
        {!loading && !error && cases.length > 0 && (
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
                  {cases.map((inv) => (
                    <tr
                      key={inv._id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/investigations/${inv._id}`)}
                    >
                      <td className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {inv.caseId}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {inv.title}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        👤 {inv.assignedTo?.name || 'Unassigned'}
                      </td>
                      <td>
                        <PriorityBadge priority={inv.priority} />
                      </td>
                      <td>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: 13 }}>
                        {formatDate(inv.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={data.meta?.page}
              totalPages={data.meta?.totalPages}
              total={data.meta?.total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {showForm && (
        <NewInvestigationModal
          onClose={() => setShowForm(false)}
          onCreated={(inv) => {
            setPage(1);
            refetch();
          }}
        />
      )}
    </AppLayout>
  );
}
