import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { LoadingState, ErrorState } from '../components/States';
import { RiskBadge, FraudStatusBadge, StatusBadge, RiskScoreBar } from '../components/Badges';
import { ConfirmDialog } from '../components/Modal';
import { useApi } from '../hooks/useApi';
import { transactionService } from '../services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/format';

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [showDelete, setShowDelete] = useState(false);
  const [actionError, setActionError] = useState('');

  const { data, loading, error, refetch } = useApi(() => transactionService.get(id), [id]);

  const handleDelete = async () => {
    try {
      await transactionService.remove(id);
      navigate('/transactions');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete transaction');
      setShowDelete(false);
    }
  };

  const handleFraudStatusChange = async (fraudStatus) => {
    try {
      await transactionService.update(id, { fraudStatus });
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update transaction');
    }
  };

  if (loading) {
    return (
      <AppLayout title="Transaction Details">
        <LoadingState label="Loading transaction..." />
      </AppLayout>
    );
  }
  if (error) {
    return (
      <AppLayout title="Transaction Details">
        <ErrorState message={error} onRetry={refetch} />
      </AppLayout>
    );
  }

  const { transaction, related } = data.data;

  return (
    <AppLayout title={`Transaction ${transaction.transactionRef}`}>
      {actionError && <p className="field-error">{actionError}</p>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <h3>Transaction Overview</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <RiskBadge level={transaction.riskLevel} />
            <FraudStatusBadge status={transaction.fraudStatus} />
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <div className="label">Amount</div>
            <div className="value">{formatCurrency(transaction.amount, transaction.currency)}</div>
          </div>
          <div className="detail-item">
            <div className="label">Sender Account</div>
            <div className="value">{transaction.senderAccount}</div>
          </div>
          <div className="detail-item">
            <div className="label">Receiver Account</div>
            <div className="value">{transaction.receiverAccount}</div>
          </div>
          <div className="detail-item">
            <div className="label">Type</div>
            <div className="value" style={{ textTransform: 'capitalize' }}>{transaction.transactionType}</div>
          </div>
          <div className="detail-item">
            <div className="label">Payment Method</div>
            <div className="value" style={{ textTransform: 'capitalize' }}>{transaction.paymentMethod}</div>
          </div>
          <div className="detail-item">
            <div className="label">Status</div>
            <div className="value">
              <StatusBadge status={transaction.status} />
            </div>
          </div>
          <div className="detail-item">
            <div className="label">Location</div>
            <div className="value">{transaction.location}</div>
          </div>
          <div className="detail-item">
            <div className="label">Occurred At</div>
            <div className="value">{formatDate(transaction.occurredAt)}</div>
          </div>
          <div className="detail-item">
            <div className="label">IP Address</div>
            <div className="value">{transaction.ipAddress || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="label">Device</div>
            <div className="value">{transaction.deviceInfo || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="label">Risk Score</div>
            <div className="value">
              <RiskScoreBar score={transaction.riskScore} level={transaction.riskLevel} />
            </div>
          </div>
          <div className="detail-item">
            <div className="label">Investigation</div>
            <div className="value">
              {transaction.investigation ? (
                <a href={`/investigations/${transaction.investigation._id || transaction.investigation}`}>
                  {transaction.investigation.caseId || 'View'}
                </a>
              ) : (
                'Not linked'
              )}
            </div>
          </div>
        </div>

        {transaction.suspicionReasons?.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div className="label" style={{ fontSize: 11.5, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>
              Detection Reasons
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>
              {transaction.suspicionReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {hasRole('admin', 'investigator') && (
          <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={() => handleFraudStatusChange('confirmed_fraud')}>
              Mark Confirmed Fraud
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => handleFraudStatusChange('false_positive')}>
              Mark False Positive
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => handleFraudStatusChange('clean')}>
              Mark Clean
            </button>
            {hasRole('admin') && (
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
                Delete Transaction
              </button>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Related Transactions ({related.length})</h3>
        </div>
        {related.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No related transactions found for these accounts.</p>}
        {related.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Amount</th>
                  <th>Risk</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {related.map((t) => (
                  <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/transactions/${t._id}`)}>
                    <td>{t.transactionRef}</td>
                    <td>{t.senderAccount}</td>
                    <td>{t.receiverAccount}</td>
                    <td>{formatCurrency(t.amount, t.currency)}</td>
                    <td><RiskBadge level={t.riskLevel} /></td>
                    <td>{formatDate(t.occurredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDelete && (
        <ConfirmDialog
          title="Delete transaction?"
          message="This action cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </AppLayout>
  );
}
