import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AppLayout from '../layouts/AppLayout';
import { ErrorState } from '../components/States';
import { NetworkSkeleton } from '../components/Skeleton';
import { useApi } from '../hooks/useApi';
import { transactionService } from '../services';
import { formatCurrency } from '../utils/format';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'suspicious', label: 'Suspicious' },
  { key: 'high', label: 'High / Critical' },
  { key: 'critical', label: 'Critical' },
];

const DEFAULT_SETTINGS = {
  riskSensitivity: 72,
  anomalyWindow: 6,
  velocityWatch: 68,
  geoShield: true,
  peerReview: true,
  autoEscalation: true,
};

const VIEW_TABS = [
  { key: 'graph', label: 'Graph' },
  { key: 'analytics', label: 'Analytics' },
];

const RISK_COLORS = {
  low: 'var(--status-safe)',
  medium: 'var(--status-medium)',
  high: 'var(--status-high)',
  critical: 'var(--status-high)',
};

function getVisibleRiskLevel(level) {
  if (!level) return 'low';
  if (level === 'critical') return 'critical';
  if (level === 'high') return 'high';
  if (level === 'medium') return 'medium';
  return 'low';
}

export default function NetworkView() {
  const { data, loading, error, refetch } = useApi(() => transactionService.network({ limit: 250 }), []);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('graph');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [collapsed, setCollapsed] = useState({
    detectionSettings: false,
    aiCoPilot: false,
    behavioralInsight: false,
  });

  const toggleSection = (section) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const allNodes = data?.data?.nodes ?? [];
  const allEdges = data?.data?.edges ?? [];

  const filteredEdges = useMemo(() => {
    switch (filter) {
      case 'suspicious':
        return allEdges.filter((edge) => edge.suspicious);
      case 'high':
        return allEdges.filter((edge) => ['high', 'critical'].includes(edge.riskLevel));
      case 'critical':
        return allEdges.filter((edge) => edge.riskLevel === 'critical');
      default:
        return allEdges;
    }
  }, [allEdges, filter]);

  const visibleNodeIds = useMemo(
    () => new Set(filteredEdges.flatMap((edge) => [edge.source, edge.target])),
    [filteredEdges],
  );

  const visibleNodes = useMemo(() => {
    if (!filteredEdges.length) return [];
    return allNodes.filter((node) => visibleNodeIds.has(node.id));
  }, [allNodes, filteredEdges, visibleNodeIds]);

  useEffect(() => {
    if (!selected) return;
    if (!visibleNodeIds.has(selected.id)) {
      setSelected(null);
    }
  }, [selected, visibleNodeIds]);

  const summary = useMemo(() => {
    const suspiciousTransactions = filteredEdges.filter((edge) => edge.suspicious).length;
    const criticalTransactions = filteredEdges.filter((edge) => edge.riskLevel === 'critical').length;
    const highRiskTransactions = filteredEdges.filter((edge) => ['high', 'critical'].includes(edge.riskLevel)).length;

    return {
      accounts: visibleNodes.length,
      transactions: filteredEdges.length,
      suspiciousTransactions,
      highRiskTransactions,
      criticalTransactions,
    };
  }, [filteredEdges, visibleNodes]);

  const riskDistribution = useMemo(() => {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };
    filteredEdges.forEach((edge) => {
      const risk = getVisibleRiskLevel(edge.riskLevel);
      distribution[risk] += 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [filteredEdges]);

  const aiBrief = useMemo(() => {
    const riskPressure = summary.criticalTransactions > 0 ? 'high' : summary.highRiskTransactions > 0 ? 'elevated' : 'stable';
    const primaryAction = summary.criticalTransactions > 0
      ? 'Escalate the critical paths to the investigation queue and request manual review on the top counterparties.'
      : summary.highRiskTransactions > 0
        ? 'Keep the current watchlist active and review the highest-risk counterparties before new transfers settle.'
        : 'No critical network patterns are active; continue normal monitoring and preserve the current thresholds.';

    return {
      riskPressure,
      primaryAction,
      suggestions: [
        settings.autoEscalation ? 'Auto-escalation is enabled for time-sensitive threats.' : 'Escalation is currently manual for flagged flows.',
        settings.geoShield ? 'Regional anomaly guard is active across the network.' : 'Regional anomaly checks are paused for this review window.',
        settings.peerReview ? 'Peer comparison checks are reinforcing suspicious activity detection.' : 'Peer comparisons are disabled and should be reviewed.',
      ],
    };
  }, [settings, summary]);

  const topAccounts = useMemo(
    () =>
      [...visibleNodes]
        .sort((a, b) => b.transactionCount - a.transactionCount)
        .slice(0, 6)
        .map((account) => ({
          name: account.id,
          transactions: account.transactionCount,
          suspicious: account.suspiciousCount,
        })),
    [visibleNodes],
  );

  const layout = useMemo(() => {
    if (!visibleNodes.length) return null;

    const size = 620;
    const center = size / 2;
    const radius = size / 2 - 52;

    const positioned = visibleNodes.map((node, index) => {
      const angle = (visibleNodes.length === 1 ? 0 : index / visibleNodes.length) * Math.PI * 2;
      return {
        ...node,
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
      };
    });

    const nodeMap = new Map(positioned.map((node) => [node.id, node]));
    return { nodes: positioned, edges: filteredEdges, nodeMap, size };
  }, [filteredEdges, visibleNodes]);

  if (loading) {
    return (
      <AppLayout title="Transaction Network">
        <NetworkSkeleton />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Transaction Network">
        <ErrorState message={error} onRetry={refetch} />
      </AppLayout>
    );
  }

  if (!layout) {
    return (
      <AppLayout title="Transaction Network">
        <div className="card">
          <div className="card-header">
            <h3>Account Relationship Graph</h3>
          </div>
          <div className="empty-state" style={{ padding: '60px 20px', margin: '16px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🕸️</div>
            <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: 15 }}>
              No relationships match the current filter
            </h4>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 13, maxWidth: 420, marginInline: 'auto' }}>
              No nodes or transaction edges meet the criteria for this filter. Try switching back to "All" to inspect the complete network graph.
            </p>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setFilter('all')}>
              Reset to All Filters
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { nodes, edges, nodeMap, size } = layout;

  return (
    <AppLayout title="Transaction Network">
      <div className="card">
        {/* Header */}
        <div className="card-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="card-title">relationship topology</div>
            <h3 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🕸️</span> Account Risk Network
            </h3>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {summary.accounts} accounts · {summary.transactions} transactions
          </span>
        </div>

        {/* View Mode & Filter Toolbars */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16, borderBottom: '1px solid var(--border-hairline)', paddingBottom: 10 }}>
          <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`tab ${viewMode === tab.key ? 'active' : ''}`}
                onClick={() => setViewMode(tab.key)}
                style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: '8px 16px' }}
              >
                {tab.key === 'graph' ? '🕸️ ' : '📊 '}{tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>
              Filter:
            </span>
            {FILTERS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`btn btn-sm ${filter === tab.key ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter(tab.key)}
                style={{ fontSize: 12, padding: '5px 11px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Summary Stat Cards (matching exact test selectors) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 18 }}>
          <div className="stat-card" style={{ padding: 14 }}>
            <div className="stat-label">Accounts</div>
            <div className="stat-value" style={{ fontSize: 22 }}>{summary.accounts}</div>
          </div>
          <div className="stat-card" style={{ padding: 14 }}>
            <div className="stat-label">Flagged</div>
            <div className="stat-value" style={{ fontSize: 22, color: 'var(--status-medium)' }}>{summary.suspiciousTransactions}</div>
          </div>
          <div className="stat-card" style={{ padding: 14 }}>
            <div className="stat-label">High risk</div>
            <div className="stat-value" style={{ fontSize: 22, color: 'var(--status-high)' }}>{summary.highRiskTransactions}</div>
          </div>
          <div className="stat-card" style={{ padding: 14 }}>
            <div className="stat-label">Critical</div>
            <div className="stat-value" style={{ fontSize: 22, color: 'var(--status-high)' }}>{summary.criticalTransactions}</div>
          </div>
        </div>

        {/* Collapsible Detection Settings */}
        <div className="card" style={{ marginBottom: 18, background: 'rgba(216, 232, 222, 0.015)' }}>
          <div className="card-header">
            <h3>
              <span>⚙️</span> Detection Settings
              {collapsed.detectionSettings && (
                <span className="panel-collapsed-badge">
                  Sens: {settings.riskSensitivity}% · Win: {settings.anomalyWindow}h · Vel: {settings.velocityWatch}%
                </span>
              )}
            </h3>
            <div className="card-header-actions">
              <span className="badge badge-low">Live policy</span>
              <button
                type="button"
                className="panel-toggle-btn"
                onClick={() => toggleSection('detectionSettings')}
                title={collapsed.detectionSettings ? 'Expand Detection Settings' : 'Minimize Detection Settings'}
                aria-label="Toggle Detection Settings"
              >
                {collapsed.detectionSettings ? '▸' : '▾'}
              </button>
            </div>
          </div>

          {!collapsed.detectionSettings && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span>Risk sensitivity</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{settings.riskSensitivity}%</strong>
                  </div>
                  <input
                    type="range"
                    min="45"
                    max="95"
                    value={settings.riskSensitivity}
                    onChange={(event) => setSettings((current) => ({ ...current, riskSensitivity: Number(event.target.value) }))}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span>Anomaly window</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{settings.anomalyWindow}h</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={settings.anomalyWindow}
                    onChange={(event) => setSettings((current) => ({ ...current, anomalyWindow: Number(event.target.value) }))}
                    style={{ accentColor: 'var(--accent-cyan)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span>Velocity watch</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{settings.velocityWatch}%</strong>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="90"
                    value={settings.velocityWatch}
                    onChange={(event) => setSettings((current) => ({ ...current, velocityWatch: Number(event.target.value) }))}
                    style={{ accentColor: 'var(--status-medium)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 16 }}>
                {[
                  { key: 'geoShield', label: 'Regional anomaly guard' },
                  { key: 'peerReview', label: 'Peer comparison checks' },
                  { key: 'autoEscalation', label: 'Auto-escalation' },
                ].map((toggle) => (
                  <label key={toggle.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', border: '1px solid var(--border-hairline)', borderRadius: 6, background: 'rgba(216, 232, 222, 0.02)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
                    <span>{toggle.label}</span>
                    <input
                      type="checkbox"
                      checked={settings[toggle.key]}
                      onChange={(event) => setSettings((current) => ({ ...current, [toggle.key]: event.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* View Mode: Analytics vs Graph */}
        {viewMode === 'analytics' ? (
          /* Cohesive 2-Column Responsive Dashboard Layout */
          <div className="charts-grid" style={{ marginTop: 10 }}>
            {/* Column 1 - Top: AI Co-Pilot */}
            <div className="card">
              <div className="card-header">
                <h3>
                  <span>🤖</span> AI Co-Pilot
                  {collapsed.aiCoPilot && (
                    <span className="panel-collapsed-badge">Risk: {aiBrief.riskPressure}</span>
                  )}
                </h3>
                <div className="card-header-actions">
                  <span className={`badge ${aiBrief.riskPressure === 'high' ? 'badge-high' : aiBrief.riskPressure === 'elevated' ? 'badge-medium' : 'badge-low'}`}>
                    {aiBrief.riskPressure}
                  </span>
                  <button
                    type="button"
                    className="panel-toggle-btn"
                    onClick={() => toggleSection('aiCoPilot')}
                    title={collapsed.aiCoPilot ? 'Expand AI Co-Pilot' : 'Minimize AI Co-Pilot'}
                    aria-label="Toggle AI Co-Pilot"
                  >
                    {collapsed.aiCoPilot ? '▸' : '▾'}
                  </button>
                </div>
              </div>

              {!collapsed.aiCoPilot && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, fontWeight: 600 }}>
                      Recommended Response
                    </div>
                    <div style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: 13, background: 'rgba(57, 255, 158, 0.04)', padding: '10px 12px', borderRadius: 4, borderLeft: '3px solid var(--accent)' }}>
                      {aiBrief.primaryAction}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, fontWeight: 600 }}>
                      Policy Safeguards
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-primary)', lineHeight: 1.7, fontSize: 12.5 }}>
                      {aiBrief.suggestions.map((suggestion) => (
                        <li key={suggestion}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Column 2 - Top: Behavioral Insight */}
            <div className="card">
              <div className="card-header">
                <h3>
                  <span>🧠</span> Behavioral Insight
                  {collapsed.behavioralInsight && (
                    <span className="panel-collapsed-badge">{summary.suspiciousTransactions} flagged flows</span>
                  )}
                </h3>
                <div className="card-header-actions">
                  <span className={`badge ${summary.criticalTransactions > 0 ? 'badge-critical' : summary.suspiciousTransactions > 0 ? 'badge-warn' : 'badge-low'}`}>
                    {summary.criticalTransactions > 0 ? 'Critical Anomaly' : summary.suspiciousTransactions > 0 ? 'Suspicious Clustering' : 'Normal Baseline'}
                  </span>
                  <button
                    type="button"
                    className="panel-toggle-btn"
                    onClick={() => toggleSection('behavioralInsight')}
                    title={collapsed.behavioralInsight ? 'Expand Behavioral Insight' : 'Minimize Behavioral Insight'}
                    aria-label="Toggle Behavioral Insight"
                  >
                    {collapsed.behavioralInsight ? '▸' : '▾'}
                  </button>
                </div>
              </div>

              {!collapsed.behavioralInsight && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: 13, background: 'rgba(56, 232, 255, 0.04)', padding: '12px 14px', borderRadius: 4, borderLeft: '3px solid var(--accent-cyan)' }}>
                    {summary.suspiciousTransactions > 0
                      ? `The monitored slice contains ${summary.suspiciousTransactions} suspicious edges with ${summary.criticalTransactions} critical-risk flows. The highest activity accounts are concentrated around repeat counterparties, increasing probability of coordinated syndicates.`
                      : 'No suspicious edges are currently flagged in this network slice. Pattern recognition indicates normal baseline activity with low counterparty volatility.'}
                  </div>

                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    <span>Density: <strong style={{ color: 'var(--text-primary)' }}>{visibleNodes.length > 0 ? (filteredEdges.length / visibleNodes.length).toFixed(2) : 0} tx/node</strong></span>
                    <span>·</span>
                    <span>Flagged Ratio: <strong style={{ color: summary.suspiciousTransactions > 0 ? 'var(--status-medium)' : 'var(--status-safe)' }}>
                      {filteredEdges.length > 0 ? `${((summary.suspiciousTransactions / filteredEdges.length) * 100).toFixed(1)}%` : '0%'}
                    </strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Column 1 - Bottom: Risk Distribution */}
            <div className="card">
              <div className="card-header">
                <h3>
                  <span>🎯</span> Risk Distribution
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={riskDistribution} dataKey="value" nameKey="name" innerRadius={52} outerRadius={88}>
                    {riskDistribution.map((entry) => (
                      <Cell key={entry.name} fill={RISK_COLORS[entry.name] || 'var(--status-safe)'} />
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

            {/* Column 2 - Bottom: Highest Activity Accounts */}
            <div className="card">
              <div className="card-header">
                <h3>
                  <span>📊</span> Highest Activity Accounts
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topAccounts}>
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
                  <Bar dataKey="transactions" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          /* Graph Mode: SVG Topology Visualizer & Counterparty Inspector */
          <div>
            {/* AI Co-Pilot Summary in Graph Mode */}
            <div className="card" style={{ marginBottom: 18 }}>
              <div className="card-header">
                <h3>
                  <span>🤖</span> AI Co-Pilot
                  {collapsed.aiCoPilot && (
                    <span className="panel-collapsed-badge">Risk: {aiBrief.riskPressure}</span>
                  )}
                </h3>
                <div className="card-header-actions">
                  <span className={`badge ${aiBrief.riskPressure === 'high' ? 'badge-high' : aiBrief.riskPressure === 'elevated' ? 'badge-medium' : 'badge-low'}`}>
                    {aiBrief.riskPressure}
                  </span>
                  <button
                    type="button"
                    className="panel-toggle-btn"
                    onClick={() => toggleSection('aiCoPilot')}
                    title={collapsed.aiCoPilot ? 'Expand AI Co-Pilot' : 'Minimize AI Co-Pilot'}
                    aria-label="Toggle AI Co-Pilot"
                  >
                    {collapsed.aiCoPilot ? '▸' : '▾'}
                  </button>
                </div>
              </div>

              {!collapsed.aiCoPilot && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, fontWeight: 600 }}>
                      Recommended Response
                    </div>
                    <div style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: 13, background: 'rgba(57, 255, 158, 0.04)', padding: '10px 12px', borderRadius: 4, borderLeft: '3px solid var(--accent)' }}>
                      {aiBrief.primaryAction}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, fontWeight: 600 }}>
                      Policy Safeguards
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-primary)', lineHeight: 1.7, fontSize: 12.5 }}>
                      {aiBrief.suggestions.map((suggestion) => (
                        <li key={suggestion}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Topology SVG + Inspector */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <svg width={size} height={size} style={{ maxWidth: '100%', flexShrink: 0, background: 'rgba(10, 14, 12, 0.55)', border: '1px solid var(--border-hairline)', borderRadius: 6 }}>
                {edges.map((edge, index) => {
                  const source = nodeMap.get(edge.source);
                  const target = nodeMap.get(edge.target);
                  if (!source || !target) return null;

                  const level = getVisibleRiskLevel(edge.riskLevel);
                  const stroke = RISK_COLORS[level];

                  return (
                    <line
                      key={`${edge.source}-${edge.target}-${index}`}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={stroke}
                      strokeWidth={edge.suspicious ? 2.2 : 1.2}
                      opacity={edge.suspicious ? 0.9 : 0.4}
                    />
                  );
                })}

                {nodes.map((node) => {
                  const riskBucket = node.suspiciousCount > 0 ? 'high' : 'low';

                  return (
                    <g key={node.id} onClick={() => setSelected(node)} style={{ cursor: 'pointer' }}>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.suspiciousCount > 0 ? 12 : 8}
                        fill={riskBucket === 'high' ? 'var(--status-high)' : 'var(--status-safe)'}
                        stroke={node.suspiciousCount > 0 ? 'rgba(255, 77, 77, 0.6)' : 'rgba(57, 255, 158, 0.6)'}
                        strokeWidth={1.5}
                        opacity={0.98}
                      />
                      <text
                        x={node.x}
                        y={node.y + 4}
                        fontSize={9}
                        textAnchor="middle"
                        fill="var(--text-primary)"
                        style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                      >
                        {node.id.slice(-4)}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14, color: 'var(--text-secondary)', fontSize: 12 }}>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: 'var(--status-safe)', marginRight: 6 }} />Stable</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: 'var(--status-medium)', marginRight: 6 }} />Medium</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: 'var(--status-high)', marginRight: 6 }} />High / critical</span>
                </div>

                {selected ? (
                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: 18, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{selected.id}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span className={`badge ${selected.suspiciousCount > 0 ? 'badge-high' : 'badge-low'}`}>
                        {selected.suspiciousCount > 0 ? 'Risk active' : 'Low risk'}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        {selected.transactionCount} linked transactions
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(100px, 1fr))', gap: 10, marginBottom: 12 }}>
                      <div className="stat-card" style={{ padding: 12 }}>
                        <div className="stat-label" style={{ fontSize: 11 }}>Total txns</div>
                        <div className="stat-value" style={{ fontSize: 18 }}>{selected.transactionCount}</div>
                      </div>
                      <div className="stat-card" style={{ padding: 12 }}>
                        <div className="stat-label" style={{ fontSize: 11 }}>Flagged</div>
                        <div className="stat-value" style={{ fontSize: 18, color: 'var(--status-high)' }}>{selected.suspiciousCount}</div>
                      </div>
                    </div>

                    <h5 style={{ margin: '0 0 8px', fontSize: 13 }}>Connected transactions</h5>
                    <div className="table-wrap" style={{ maxHeight: 260, overflowY: 'auto' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Ref</th>
                            <th>Edge</th>
                            <th>Risk</th>
                            <th>Amt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {edges
                            .filter((edge) => edge.source === selected.id || edge.target === selected.id)
                            .slice(0, 20)
                            .map((edge, index) => (
                              <tr key={`${edge.transactionRef}-${index}`}>
                                <td className="font-mono" style={{ color: 'var(--accent-cyan)' }}>{edge.transactionRef}</td>
                                <td className="font-mono" style={{ fontSize: 12 }}>{edge.source === selected.id ? '→' : '←'} {edge.source === selected.id ? edge.target : edge.source}</td>
                                <td>
                                  <span
                                    className="badge"
                                    style={{
                                      background: `${RISK_COLORS[getVisibleRiskLevel(edge.riskLevel)]}1A`,
                                      color: RISK_COLORS[getVisibleRiskLevel(edge.riskLevel)],
                                    }}
                                  >
                                    {getVisibleRiskLevel(edge.riskLevel)}
                                  </span>
                                </td>
                                <td className="data-value">{formatCurrency(edge.amount)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, background: 'rgba(216, 232, 222, 0.02)', padding: '16px', borderRadius: 4, border: '1px dashed var(--border-hairline)' }}>
                    👉 Click any node in the topology map to inspect its counterparty history, flagged flows, and linked transactions.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
