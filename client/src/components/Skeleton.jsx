import React from 'react';

export function SkeletonBox({ width = '100%', height = '20px', style = {}, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ height = '120px', className = '', children }) {
  return (
    <div className={`card skeleton-card ${className}`} style={{ minHeight: height, position: 'relative' }}>
      {children || <SkeletonBox height="100%" />}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div style={{ animation: 'fadeIn 0.2s ease-in' }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <SkeletonBox width="140px" height="24px" />
        <SkeletonBox width="10px" height="10px" style={{ borderRadius: '50%' }} />
      </div>

      {/* Threat Deck Skeleton */}
      <div style={{ marginBottom: 20 }}>
        <SkeletonBox width="120px" height="14px" style={{ marginBottom: 10 }} />
        <div className="kpi-threat-deck">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card stat-card-hero" style={{ height: '124px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SkeletonBox width="110px" height="13px" />
                <SkeletonBox width="80px" height="16px" style={{ borderRadius: '2px' }} />
              </div>
              <SkeletonBox width="90px" height="32px" />
              <SkeletonBox width="130px" height="12px" />
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Metrics Skeleton */}
      <div style={{ marginBottom: 24 }}>
        <SkeletonBox width="140px" height="14px" style={{ marginBottom: 10 }} />
        <div className="kpi-secondary-deck">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="stat-card stat-card-compact" style={{ height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <SkeletonBox width="90px" height="12px" />
              <SkeletonBox width="70px" height="20px" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid Skeleton */}
      <div className="charts-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card" style={{ height: '330px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <SkeletonBox width="160px" height="18px" />
              <SkeletonBox width="24px" height="24px" />
            </div>
            <SkeletonBox height="240px" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 10 }) {
  return (
    <div className="table-wrap" style={{ animation: 'fadeIn 0.2s ease-in' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th><SkeletonBox width="90px" height="14px" /></th>
            <th><SkeletonBox width="60px" height="14px" /></th>
            <th><SkeletonBox width="60px" height="14px" /></th>
            <th><SkeletonBox width="70px" height="14px" /></th>
            <th><SkeletonBox width="50px" height="14px" /></th>
            <th><SkeletonBox width="110px" height="14px" /></th>
            <th><SkeletonBox width="60px" height="14px" /></th>
            <th><SkeletonBox width="80px" height="14px" /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              <td><SkeletonBox width="150px" height="14px" /></td>
              <td><SkeletonBox width="70px" height="14px" /></td>
              <td><SkeletonBox width="70px" height="14px" /></td>
              <td><SkeletonBox width="80px" height="14px" /></td>
              <td><SkeletonBox width="60px" height="14px" /></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SkeletonBox width="20px" height="14px" />
                  <SkeletonBox width="60px" height="6px" style={{ borderRadius: 999 }} />
                  <SkeletonBox width="45px" height="18px" style={{ borderRadius: 999 }} />
                </div>
              </td>
              <td><SkeletonBox width="55px" height="18px" style={{ borderRadius: 999 }} /></td>
              <td><SkeletonBox width="110px" height="14px" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NetworkSkeleton() {
  return (
    <div style={{ animation: 'fadeIn 0.2s ease-in' }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <SkeletonBox width="100px" height="12px" style={{ marginBottom: 6 }} />
          <SkeletonBox width="180px" height="24px" />
        </div>
        <SkeletonBox width="160px" height="18px" />
      </div>

      {/* Tabs Skeleton */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <SkeletonBox width="80px" height="34px" />
        <SkeletonBox width="90px" height="34px" />
      </div>

      {/* 4 Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 12, marginBottom: 18 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card" style={{ padding: 14 }}>
            <SkeletonBox width="70px" height="12px" style={{ marginBottom: 8 }} />
            <SkeletonBox width="45px" height="24px" />
          </div>
        ))}
      </div>

      {/* 2-Column Main Skeleton */}
      <div className="charts-grid">
        <div className="card" style={{ height: '380px' }}>
          <SkeletonBox width="120px" height="18px" style={{ marginBottom: 16 }} />
          <SkeletonBox height="300px" />
        </div>
        <div className="card" style={{ height: '380px' }}>
          <SkeletonBox width="140px" height="18px" style={{ marginBottom: 16 }} />
          <SkeletonBox height="300px" />
        </div>
      </div>
    </div>
  );
}
