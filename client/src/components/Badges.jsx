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
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ minWidth: 28, color: 'var(--color-text)' }}>{value}</span>
      <div style={{ width: 80, height: 8, borderRadius: 999, background: 'rgba(216, 232, 222, 0.08)', overflow: 'hidden', display: 'inline-block' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.2s ease' }} />
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
    open: 'badge-neutral',
    under_investigation: 'badge-warn',
    escalated: 'badge-danger',
    resolved: 'badge-success',
    closed: 'badge-neutral',
    pending: 'badge-warn',
    completed: 'badge-success',
    failed: 'badge-danger',
    reversed: 'badge-neutral',
  };
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{titleCase(status || 'unknown')}</span>;
}
