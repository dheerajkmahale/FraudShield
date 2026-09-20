import React from 'react';

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title = 'Are you sure?', message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 0 }}>{message}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <button className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
