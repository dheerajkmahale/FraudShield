import React from 'react';

export function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="loading-state">
      <span className="spinner" />
      {label}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="error-state">
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-outline btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'No data found.' }) {
  return <div className="empty-state">{message}</div>;
}
