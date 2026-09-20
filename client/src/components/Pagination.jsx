import React from 'react';

export default function Pagination({ page, totalPages, total, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="pagination">
      <span>
        Page {page} of {totalPages} ({total} total)
      </span>
      <div className="pagination-controls">
        <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
