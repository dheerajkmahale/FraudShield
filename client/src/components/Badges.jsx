import React from 'react';
import { titleCase } from '../utils/format';

export function getRiskTone(level) {
  const palette = {
    low: {
      badgeClass: 'badge-low',
      color: 'var(--status-safe)',
    },
    medium: {
      badgeClass: 'badge-medium',
      color: 'var(--status-medium)',
    },
    high: {
      badgeClass: 'badge-high',
      color: 'var(--status-high)',
    },
    critical: {
      badgeClass: 'badge-critical',
      color: 'var(--status-high)',
    },
  };

  return palette[level] || { badgeClass: 'badge-neutral', color: 'var(--text-secondary)' };
}

export function RiskBadge({ level }) {
  const { badgeClass } = getRiskTone(level);
  return <span className={`badge ${badgeClass}`}>{titleCase(level || 'unknown')}</span>;
}

export function RiskScoreBar({ score, level }) {
  const value = Math.min(Math.max(Number(score) || 0, 0), 100);
  const { color } = getRiskTone(level);

  return (
    <div className="risk-score-cell">
      <span className="risk-score-num" style={{ color }}>{value}</span>
      <div className="risk-score-track">
        <div className="risk-score-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export function FraudStatusBadge({ status }) {
  const map = {
    clean: 'badge-success',
    flagged: 'badge-warn',
    confirmed_fraud: 'badge-danger',
    false_positive: 'badge-neutral',
  };
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{titleCase(status || 'unknown')}</span>;
}

export function StatusBadge({ status }) {
  const map = {
    open: 'badge-open',
    under_investigation: 'badge-under-investigation',
    escalated: 'badge-escalated',
    resolved: 'badge-resolved',
    closed: 'badge-closed',
    pending: 'badge-warn',
    completed: 'badge-success',
    failed: 'badge-danger',
    reversed: 'badge-neutral',
  };
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{titleCase(status || 'unknown')}</span>;
}

export function PriorityBadge({ priority = 'medium' }) {
  const map = {
    urgent: 'badge-escalated',
    high: 'badge-under-investigation',
    medium: 'badge-open',
    low: 'badge-resolved',
  };
  return (
    <span className={`badge ${map[priority] || 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
      {priority}
    </span>
  );
}
