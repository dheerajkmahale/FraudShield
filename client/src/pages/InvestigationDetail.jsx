import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { LoadingState, ErrorState } from '../components/States';
import { StatusBadge, RiskBadge } from '../components/Badges';
import { useApi } from '../hooks/useApi';
import { investigationService } from '../services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, titleCase } from '../utils/format';

const STATUSES = ['open', 'under_investigation', 'escalated', 'resolved', 'closed'];

export default function InvestigationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [actionError, setActionError] = useState('');

  const { data, loading, error, refetch } = useApi(() => investigationService.get(id), [id]);

  const handleStatusChange = async (status) => {
    try {
      await investigationService.update(id, { status });
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    try {
      await investigationService.addNote(id, noteText.trim());
      setNoteText('');
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to add note');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Investigation Details">
        <LoadingState label="Loading investigation..." />
      </AppLayout>
    );
  }
  if (error) {
    return (
      <AppLayout title="Investigation Details">
        <ErrorState message={error} onRetry={refetch} />
      </AppLayout>
    );
  }

  const inv = data.data;
  const canManage = hasRole('admin', 'investigator');

  return (
    <AppLayout title={`Investigation ${inv.caseId}`}>
      {actionError && <p className="field-error">{actionError}</p>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <h3>{inv.title}</h3>
          <StatusBadge status={inv.status} />
        </div>
        <p style={{ color: 'var(--color-text-muted)' }}>{inv.description || 'No description provided.'}</p>

        <div className="detail-grid">
          <div className="detail-item">
            <div className="label">Priority</div>
            <div className="value" style={{ textTransform: 'capitalize' }}>{inv.priority}</div>
          </div>
          <div className="detail-item">
            <div className="label">Assigned To</div>
            <div className="value">{inv.assignedTo?.name || 'Unassigned'}</div>
          </div>
          <div className="detail-item">
            <div className="label">Created By</div>
            <div className="value">{inv.createdBy?.name}</div>
          </div>
          <div className="detail-item">
            <div className="label">Created</div>
            <div className="value">{formatDate(inv.createdAt)}</div>
          </div>
        </div>

        {canManage && (
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, marginRight: 8 }}>Change status:</label>
            <select value={inv.status} onChange={(e) => handleStatusChange(e.target.value)} style={{ width: 'auto', display: 'inline-block' }}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <h3>Related Transactions ({inv.relatedTransactions?.length || 0})</h3>
        </div>
        {(!inv.relatedTransactions || inv.relatedTransactions.length === 0) && (
          <p style={{ color: 'var(--color-text-muted)' }}>No transactions linked yet.</p>
        )}
        {inv.relatedTransactions?.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {inv.relatedTransactions.map((t) => (
                  <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/transactions/${t._id}`)}>
                    <td>{t.transactionRef}</td>
                    <td>{formatCurrency(t.amount)}</td>
                    <td><RiskBadge level={t.riskLevel} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Investigation Notes</h3>
        </div>
        {(!inv.notes || inv.notes.length === 0) && <p style={{ color: 'var(--color-text-muted)' }}>No notes yet.</p>}
        {inv.notes?.map((note) => (
          <div className="note-item" key={note._id}>
            <span className="note-author">{note.author?.name || 'Unknown'}</span>
            <span className="note-time">{formatDate(note.createdAt)}</span>
            <p style={{ margin: '6px 0 0' }}>{note.text}</p>
          </div>
        ))}

        {canManage && (
          <form onSubmit={handleAddNote} style={{ marginTop: 14 }}>
            <div className="form-group">
              <label>Add a note</label>
              <textarea rows={3} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Document your findings..." />
            </div>
            <button className="btn btn-primary btn-sm" type="submit" disabled={submittingNote}>
              {submittingNote ? 'Adding...' : 'Add Note'}
            </button>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
