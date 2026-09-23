import React, { useState } from 'react';
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
import { ErrorState } from '../components/States';
import { DashboardSkeleton } from '../components/Skeleton';
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

  const [collapsedPanels, setCollapsedPanels] = useState({
    timeSeries: false,
    riskDistribution: false,
    typeDistribution: false,
    topAccounts: false,
  });

  const togglePanel = (panel) => {
    setCollapsedPanels((prev) => ({ ...prev, [panel]: !prev[panel] }));
  };

  if (statsLoading || txLoading) {
    return (
      <AppLayout title="Dashboard">
        <DashboardSkeleton />
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

      {/* Control Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Live Overview
          </h2>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 9px',
              borderRadius: '999px',
              background: 'rgba(57, 255, 158, 0.10)',
              border: '1px solid rgba(57, 255, 158, 0.28)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 8px var(--accent)',
                animation: 'livePulse 2s ease-in-out infinite',
              }}
            />
            LIVE MONITORING
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            System Threat Level:
          </span>
          <span
            className={`badge ${stats.criticalRiskTransactions > 0 ? 'badge-high' : 'badge-low'}`}
            style={{ fontWeight: 700, letterSpacing: '0.03em' }}
          >
            {stats.criticalRiskTransactions > 0 ? 'ELEVATED' : 'STABLE'}
          </span>
        </div>
      </div>

      {/* KPI Section with Visual Hierarchy */}
      <div className="kpi-section">
        {/* Tier 1: Urgent Threats Deck */}
        <div className="kpi-group-label">Priority Threats &amp; Active Queue</div>
        <div className="kpi-threat-deck">
          <StatCard
            variant="urgent"
            label="Critical Risk"
            value={<span className="data-value">{stats.criticalRiskTransactions?.toLocaleString()}</span>}
            badge="ACTION REQUIRED"
            badgeColor="var(--status-high)"
            sub="High-severity transactions flagged"
            accent="var(--status-high)"
          />
          <StatCard
            variant="warning"
            label="Suspicious Transactions"
            value={<span className="data-value">{stats.suspiciousTransactions?.toLocaleString()}</span>}
            badge="NEEDS REVIEW"
            badgeColor="var(--status-medium)"
            sub="Anomalous transactions detected"
            accent="var(--status-medium)"
          />
          <StatCard
            variant="info"
            label="Active Investigations"
            value={<span className="data-value">{stats.activeInvestigations?.toLocaleString()}</span>}
            badge="IN PROGRESS"
            badgeColor="var(--accent-cyan)"
            sub="Cases currently under triage"
            accent="var(--accent-cyan)"
          />
        </div>

        {/* Tier 2: Operational Health & Volumetrics */}
        <div className="kpi-group-label" style={{ marginTop: 8 }}>Operational Health &amp; Platform Metrics</div>
        <div className="kpi-secondary-deck">
          <StatCard
            variant="compact"
            label="Fraud Rate"
            value={<span className="data-value">{`${stats.fraudRate}%`}</span>}
            sub="Of monitored stream"
            accent={Number(stats.fraudRate) > 5 ? 'var(--status-medium)' : 'var(--status-safe)'}
          />
          <StatCard
            variant="compact"
            label="Avg Risk Score"
            value={<span className="data-value">{stats.avgRiskScore}</span>}
            sub="Score threshold (0–100)"
          />
          <StatCard
            variant="compact"
            label="Total Transactions"
            value={<span className="data-value">{stats.totalTransactions?.toLocaleString()}</span>}
            sub="Cumulative logged"
          />
          <StatCard
            variant="compact"
            label="Total Value"
            value={<span className="data-value">{formatCurrency(stats.totalTransactionValue)}</span>}
            sub="Volume monitored"
          />
          <StatCard
            variant="compact"
            label="Platform Users"
            value={<span className="data-value">{stats.totalUsers?.toLocaleString()}</span>}
            sub="Active operators"
          />
        </div>
      </div>

      {/* 2-Column Responsive Analytical Grid */}
      <div className="charts-grid">
        {/* Panel 1: Transactions Over Time */}
        <div className="card">
          <div className="card-header">
            <h3>
              <span>📈</span> Transactions Over Time
              {collapsedPanels.timeSeries && (
                <span className="panel-collapsed-badge">{timeSeries.length} points</span>
              )}
            </h3>
            <div className="card-header-actions">
              <button
                className="panel-toggle-btn"
                onClick={() => togglePanel('timeSeries')}
                title={collapsedPanels.timeSeries ? 'Expand panel' : 'Minimize panel'}
                aria-label="Toggle Transactions Over Time"
              >
                {collapsedPanels.timeSeries ? '▸' : '▾'}
              </button>
            </div>
          </div>
          {!collapsedPanels.timeSeries && (
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
          )}
        </div>

        {/* Panel 2: Risk Level Distribution */}
        <div className="card">
          <div className="card-header">
            <h3>
              <span>🎯</span> Risk Level Distribution
              {collapsedPanels.riskDistribution && (
                <span className="panel-collapsed-badge">{riskDistribution.length} categories</span>
              )}
            </h3>
            <div className="card-header-actions">
              <button
                className="panel-toggle-btn"
                onClick={() => togglePanel('riskDistribution')}
                title={collapsedPanels.riskDistribution ? 'Expand panel' : 'Minimize panel'}
                aria-label="Toggle Risk Level Distribution"
              >
                {collapsedPanels.riskDistribution ? '▸' : '▾'}
              </button>
            </div>
          </div>
          {!collapsedPanels.riskDistribution && (
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
          )}
        </div>

        {/* Panel 3: Transaction Types */}
        <div className="card">
          <div className="card-header">
            <h3>
              <span>📊</span> Transaction Types
              {collapsedPanels.typeDistribution && (
                <span className="panel-collapsed-badge">{typeDistribution.length} types</span>
              )}
            </h3>
            <div className="card-header-actions">
              <button
                className="panel-toggle-btn"
                onClick={() => togglePanel('typeDistribution')}
                title={collapsedPanels.typeDistribution ? 'Expand panel' : 'Minimize panel'}
                aria-label="Toggle Transaction Types"
              >
                {collapsedPanels.typeDistribution ? '▸' : '▾'}
              </button>
            </div>
          </div>
          {!collapsedPanels.typeDistribution && (
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
          )}
        </div>

        {/* Panel 4: Top Suspicious Accounts */}
        <div className="card">
          <div className="card-header">
            <h3>
              <span>⚠️</span> Top Suspicious Accounts
              {collapsedPanels.topAccounts && (
                <span className="panel-collapsed-badge">{topAccounts.length} flagged</span>
              )}
            </h3>
            <div className="card-header-actions">
              <button
                className="panel-toggle-btn"
                onClick={() => togglePanel('topAccounts')}
                title={collapsedPanels.topAccounts ? 'Expand panel' : 'Minimize panel'}
                aria-label="Toggle Top Suspicious Accounts"
              >
                {collapsedPanels.topAccounts ? '▸' : '▾'}
              </button>
            </div>
          </div>
          {!collapsedPanels.topAccounts && (
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
                      <td className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                        {a._id}
                      </td>
                      <td className="data-value">{a.suspiciousCount}</td>
                      <td>
                        <span
                          className={`badge ${a.maxRiskScore >= 80 ? 'badge-critical' : a.maxRiskScore >= 50 ? 'badge-warn' : 'badge-low'}`}
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {a.maxRiskScore}
                        </span>
                      </td>
                      <td className="data-value">{formatCurrency(a.totalAmount)}</td>
                    </tr>
                  ))}
                  {topAccounts.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)' }}>
                        No suspicious accounts flagged in this monitoring period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
