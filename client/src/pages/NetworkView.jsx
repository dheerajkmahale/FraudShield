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
import { LoadingState, ErrorState } from '../components/States';
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
        <LoadingState label="Building network graph..." />
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
          <div className="empty-state">No relationships match the current filter.</div>
        </div>
      </AppLayout>
    );
  }

  const { nodes, edges, nodeMap, size } = layout;

  return (
    <AppLayout title="Transaction Network">
      <div className="card">
        <div className="card-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="card-title">relationship map</div>
            <h3>Account Risk Network</h3>
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {summary.accounts} accounts · {summary.transactions} transactions
          </span>
        </div>

        <div className="tabs" style={{ marginBottom: 16 }}>
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab ${viewMode === tab.key ? 'active' : ''}`}
              onClick={() => setViewMode(tab.key)}
              style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tabs" style={{ marginBottom: 16 }}>
          {FILTERS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab ${filter === tab.key ? 'active' : ''}`}
              onClick={() => setFilter(tab.key)}
              style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 12, marginBottom: 18 }}>
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

        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-header">
            <h3>Detection Settings</h3>
            <span className="badge badge-low">Live policy</span>
          </div>

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
              <label key={toggle.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', border: '1px solid var(--border-hairline)', borderRadius: 6, background: 'rgba(216, 232, 222, 0.02)', color: 'var(--text-primary)', fontSize: 13 }}>
                <span>{toggle.label}</span>
                <input
                  type="checkbox"
                  checked={settings[toggle.key]}
                  onChange={(event) => setSettings((current) => ({ ...current, [toggle.key]: event.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-header">
            <h3>AI Co-Pilot</h3>
            <span className={`badge ${aiBrief.riskPressure === 'high' ? 'badge-high' : aiBrief.riskPressure === 'elevated' ? 'badge-medium' : 'badge-low'}`}>
              {aiBrief.riskPressure}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Recommended response</div>
              <div style={{ color: 'var(--text-primary)', lineHeight: 1.7, fontSize: 13 }}>{aiBrief.primaryAction}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Policy notes</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-primary)', lineHeight: 1.8, fontSize: 13 }}>
                {aiBrief.suggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {viewMode === 'analytics' ? (
          <div className="charts-grid" style={{ marginTop: 10 }}>
            <div className="card">
              <div className="card-header">
                <h3>Risk Distribution</h3>
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

            <div className="card">
              <div className="card-header">
                <h3>Highest Activity Accounts</h3>
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

            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header">
                <h3>Behavioral Insight</h3>
              </div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 13 }}>
                {summary.suspiciousTransactions > 0
                  ? `The current network contains ${summary.suspiciousTransactions} suspicious edges with ${summary.criticalTransactions} critical-risk flows. The highest activity accounts are concentrated around a small number of repeat counterparties, which increases the likelihood of coordinated fraud patterns.`
                  : 'No suspicious edges are currently visible in this network slice. Monitoring will remain stable until new abnormal counterparties emerge.'}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <svg width={size} height={size} style={{ maxWidth: '100%', flexShrink: 0, background: 'rgba(10, 14, 12, 0.35)', border: '1px solid var(--border-hairline)', borderRadius: 6 }}>
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
                  <h4 style={{ margin: '0 0 8px', fontSize: 18 }}>{selected.id}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span className={`badge ${selected.suspiciousCount > 0 ? 'badge-high' : 'badge-low'}`}>
                      {selected.suspiciousCount > 0 ? 'Risk active' : 'Low risk'}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
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
                              <td>{edge.transactionRef}</td>
                              <td>{edge.source === selected.id ? '→' : '←'} {edge.source === selected.id ? edge.target : edge.source}</td>
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
                              <td>{formatCurrency(edge.amount)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                  Click a node to inspect its relationship history and suspicious activity.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
