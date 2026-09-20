import React, { useState } from 'react';
import { Modal } from './Modal';
import { transactionService } from '../services';

const TX_TYPES = ['transfer', 'withdrawal', 'deposit', 'payment', 'refund'];
const PAYMENT_METHODS = ['card', 'bank_transfer', 'wallet', 'upi', 'crypto', 'cash'];

const initialForm = {
  senderAccount: '',
  receiverAccount: '',
  amount: '',
  currency: 'INR',
  transactionType: 'transfer',
  paymentMethod: 'upi',
  location: '',
  ipAddress: '',
  deviceInfo: '',
};

export default function TransactionForm({ onClose, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      const res = await transactionService.create({ ...form, amount: parseFloat(form.amount) });
      onCreated(res.data);
      onClose();
    } catch (err) {
      const details = err.response?.data?.details;
      setErrors(details ? details.map((d) => d.message || d) : [err.response?.data?.message || 'Failed to create transaction']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="New Transaction" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Sender Account</label>
            <input required value={form.senderAccount} onChange={update('senderAccount')} placeholder="ACC-0001" />
          </div>
          <div className="form-group">
            <label>Receiver Account</label>
            <input required value={form.receiverAccount} onChange={update('receiverAccount')} placeholder="ACC-0002" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Amount</label>
            <input required type="number" min="0.01" step="0.01" value={form.amount} onChange={update('amount')} />
          </div>
          <div className="form-group">
            <label>Currency</label>
            <input value={form.currency} onChange={update('currency')} maxLength={3} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Transaction Type</label>
            <select value={form.transactionType} onChange={update('transactionType')}>
              {TX_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Payment Method</label>
            <select value={form.paymentMethod} onChange={update('paymentMethod')}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Location</label>
          <input value={form.location} onChange={update('location')} placeholder="e.g. Bangalore" />
        </div>

        {errors.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {errors.map((msg, i) => (
              <p key={i} className="field-error">
                {msg}
              </p>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
