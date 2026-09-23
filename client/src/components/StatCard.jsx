import React from 'react';

export default function StatCard({
  label,
  value,
  sub,
  accent,
  variant,
  badge,
  badgeColor,
  icon,
  className = '',
  style = {},
}) {
  let variantClass = '';
  if (variant === 'urgent') variantClass = 'stat-card-urgent stat-card-hero';
  else if (variant === 'warning') variantClass = 'stat-card-warning stat-card-hero';
  else if (variant === 'info') variantClass = 'stat-card-investigation stat-card-hero';
  else if (variant === 'compact') variantClass = 'stat-card-compact';

  return (
    <div className={`stat-card ${variantClass} ${className}`.trim()} style={style}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
          <div className="stat-label">{label}</div>
        </div>
        {badge && (
          <span
            className="stat-badge-tag"
            style={{
              background: badgeColor ? `${badgeColor}18` : 'rgba(216, 232, 222, 0.08)',
              color: badgeColor || 'var(--text-secondary)',
              border: `1px solid ${badgeColor ? `${badgeColor}40` : 'var(--border-hairline)'}`,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="stat-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
