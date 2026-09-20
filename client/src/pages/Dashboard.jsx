import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import AppLayout from '../layouts/AppLayout';
import StatCard from '../components/StatCard';
import { LoadingState, ErrorState } from '../components/States';
import { useApi } from '../hooks/useApi';
import { dashboardService, transactionService } from '../services';
import { formatCurrency, formatDateShort } from '../utils/format';

const RISK_COLORS = {
  low: 'var(--status-safe)',
  medium: 'var(--status-medium)',
  high: 'var(--status-high)',
  critical: 'var(--status-high)',
};

export default function Dashboard() {
  const { data: statsRes, loading: statsLoading, error: statsError, refetch } = useApi(
    () => dashboardService.statistics(),
    []
  );
  const { data: txStatsRes, loading: txLoading } = useApi(() => transactionService.statistics(), []);

  if (statsLoading || txLoading) {
    return (
      <AppLayout title="Dashboard">
        <LoadingState label="Loading dashboard..." />
      </AppLayout>
    );
  }

  if (statsError) {
    return (
      <AppLayout title="Dashboard">
        <ErrorState message={statsError} onRetry={refetch} />
      </AppLayout>
    );
  }

  const stats = statsRes?.data || {};
  const txStats = txStatsRes?.data || {};

  const timeSeries = (txStats.timeSeries || []).map((d) => ({
    date: formatDateShort(d._id),
    total: d.count,
    suspicious: d.suspiciousCount,
  }));

  const riskDistribution = (txStats.riskDistribution || []).map((d) => ({ name: d._id, value: d.count }));
  const typeDistribution = (txStats.typeDistribution || []).map((d) => ({ name: d._id, count: d.count }));
  const topAccounts = txStats.topSuspiciousAccounts || [];

  return (
    <AppLayout title="Dashboard">
      <style>{`
        @keyframes livePulse {
          0% { opacity: 0.35; transform: scale(0.9); box-shadow: 0 0 0 0 rgba(57, 255, 158, 0.32); }
          50% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 8px rgba(57, 255, 158, 0); }
          100% { opacity: 0.35; transform: scale(0.9); box-shadow: 0 0 0 0 rgba(57, 255, 158, 0.32); }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: 'var(--text-primary)' }}>Live Overview</h2>
        <span aria-label="Live monitoring indicator" title="Live monitoring" style={{ width: 10, height: 10, display: 'inline-block', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 0 0 rgba(57, 255, 158, 0.32)', animation: 'livePulse 2.2s ease-in-out infinite' }} />
      </div>
      <div className="stat-grid">
        <StatCard label="Total Transactions" value={<span className="data-value">{stats.totalTransactions?.toLocaleString()}</span>} />
        <StatCard label="Total Value" value={<span className="data-value">{formatCurrency(stats.totalTransactionValue)}</span>} />
        <StatCard label="Suspicious Transactions" value={<span className="data-value">{stats.suspiciousTransactions?.toLocaleString()}</span>} accent="var(--status-medium)" />
        <StatCard label="Critical Risk" value={<span className="data-value">{stats.criticalRiskTransactions?.toLocaleString()}</span>} accent="var(--status-high)" />
        <StatCard label="Active Investigations" value={<span className="data-value">{stats.activeInvestigations?.toLocaleString()}</span>} />
        <StatCard label="Fraud Rate" value={<span className="data-value">{`${stats.fraudRate}%`}</span>} />
        <StatCard label="Avg Risk Score" value={<span className="data-value">{stats.avgRiskScore}</span>} />
        <StatCard label="Platform Users" value={<span className="data-value">{stats.totalUsers?.toLocaleString()}</span>} />
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <h3>Transactions Over Time</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" />
              <XAxis dataKey="date" fontSize={12} tick={{ fill: 'var(--text-secondary)' }} axisLine={{ stroke: 'var(--border-hairline)' }} tickLine={{ stroke: 'var(--border-hairline)' }} />
              <YAxis fontSize={12} tick={{ fill: 'var(--text-secondary)' }} axisLine={{ stroke: 'var(--border-hairline)' }} tickLine={{ stroke: 'var(--border-hairline)' }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--bg-panel)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: '3px',
                  color: 'var(--text-primary)',
                }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="total" name="Total" stroke="var(--accent)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="suspicious" name="Suspicious" stroke="var(--accent-cyan)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Risk Level Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={riskDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                {riskDistribution.map((entry) => (
                  <Cell key={entry.name} fill={RISK_COLORS[entry.name] || 'var(--accent-cyan)'} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--bg-panel)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: '3px',
                  color: 'var(--text-primary)',
                }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Transaction Types</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={typeDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" />
              <XAxis dataKey="name" fontSize={12} tick={{ fill: 'var(--text-secondary)' }} axisLine={{ stroke: 'var(--border-hairline)' }} tickLine={{ stroke: 'var(--border-hairline)' }} />
              <YAxis fontSize={12} tick={{ fill: 'var(--text-secondary)' }} axisLine={{ stroke: 'var(--border-hairline)' }} tickLine={{ stroke: 'var(--border-hairline)' }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--bg-panel)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: '3px',
                  color: 'var(--text-primary)',
                }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Bar dataKey="count" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Top Suspicious Accounts</h3>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Suspicious Count</th>
                  <th>Max Risk Score</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {topAccounts.map((a) => (
                  <tr key={a._id}>
                    <td>{a._id}</td>
                    <td>{a.suspiciousCount}</td>
                    <td>{a.maxRiskScore}</td>
                    <td>{formatCurrency(a.totalAmount)}</td>
                  </tr>
                ))}
                {topAccounts.length === 0 && (
                  <tr>
                    <td colSpan={4}>No suspicious accounts yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
