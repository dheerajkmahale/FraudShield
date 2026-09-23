import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RiskBadge, FraudStatusBadge, RiskScoreBar } from './Badges';
import { formatCurrency, formatDate } from '../utils/format';

export default function TransactionTable({ transactions, sortConfig, onSort }) {
  const navigate = useNavigate();

  const renderSortIndicator = (key) => {
    if (sortConfig?.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const handleSort = (key) => {
    if (!onSort) return;

    onSort((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }

      return { key, direction: 'desc' };
    });
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '48px 20px', margin: '12px 0' }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
        <strong style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
          No transactions found
        </strong>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
          No records match the current filter criteria. Try clearing search or resetting risk and status filters.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Sender</th>
            <th>Receiver</th>
            <th>
              <button
                type="button"
                onClick={() => handleSort('amount')}
                style={{ background: 'transparent', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', font: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Amount {renderSortIndicator('amount')}
              </button>
            </th>
            <th>Type</th>
            <th>
              <button
                type="button"
                onClick={() => handleSort('riskScore')}
                style={{ background: 'transparent', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', font: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Risk Score {renderSortIndicator('riskScore')}
              </button>
            </th>
            <th>
              <button
                type="button"
                onClick={() => handleSort('status')}
                style={{ background: 'transparent', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', font: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Status {renderSortIndicator('status')}
              </button>
            </th>
            <th>
              <button
                type="button"
                onClick={() => handleSort('date')}
                style={{ background: 'transparent', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', font: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Date {renderSortIndicator('date')}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t._id} onClick={() => navigate(`/transactions/${t._id}`)} style={{ cursor: 'pointer' }}>
              <td className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                {t.transactionRef}
              </td>
              <td className="font-mono" style={{ color: 'var(--text-primary)' }}>
                {t.senderAccount}
              </td>
              <td className="font-mono" style={{ color: 'var(--text-primary)' }}>
                {t.receiverAccount}
              </td>
              <td className="data-value" style={{ fontWeight: 600 }}>
                {formatCurrency(t.amount, t.currency)}
              </td>
              <td style={{ textTransform: 'capitalize' }}>{t.transactionType}</td>
              <td>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, minWidth: 170 }}>
                  <RiskScoreBar score={t.riskScore} level={t.riskLevel} />
                  <RiskBadge level={t.riskLevel} />
                </div>
              </td>
              <td>
                <FraudStatusBadge status={t.fraudStatus} />
              </td>
              <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                {formatDate(t.occurredAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
