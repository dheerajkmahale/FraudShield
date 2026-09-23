import React, { useMemo, useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import TransactionTable from '../components/TransactionTable';
import Pagination from '../components/Pagination';
import TransactionForm from '../components/TransactionForm';
import { ErrorState } from '../components/States';
import { TableSkeleton } from '../components/Skeleton';
import { useApi } from '../hooks/useApi';
import { transactionService } from '../services';
import { useAuth } from '../context/AuthContext';
import { titleCase } from '../utils/format';

const RISK_LEVELS = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['pending', 'completed', 'failed', 'reversed'];

export default function Transactions() {
  const { hasRole } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  const { data, loading, error, refetch } = useApi(
    () => transactionService.list({ page, limit: 15, riskLevel: riskLevel || undefined, status: status || undefined }),
    [page, riskLevel, status]
  );

  const visibleTransactions = useMemo(() => {
    const source = data?.data || [];
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = normalizedSearch
      ? source.filter((transaction) => {
          const values = [
            transaction.transactionRef,
            transaction.senderAccount,
            transaction.receiverAccount,
          ].filter(Boolean).map((value) => String(value).toLowerCase());

          return values.some((value) => value.includes(normalizedSearch));
        })
      : source;

    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'amount') {
        aValue = Number(a.amount) || 0;
        bValue = Number(b.amount) || 0;
      }

      if (sortConfig.key === 'date') {
        aValue = new Date(a.occurredAt || 0).getTime();
        bValue = new Date(b.occurredAt || 0).getTime();
      }

      if (sortConfig.key === 'riskScore') {
        aValue = Number(a.riskScore) || 0;
        bValue = Number(b.riskScore) || 0;
      }

      if (sortConfig.key === 'status') {
        aValue = String(a.status || '').toLowerCase();
        bValue = String(b.status || '').toLowerCase();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  }, [data, search, sortConfig]);

  const exportCsv = () => {
    if (!visibleTransactions.length) return;

    const headers = ['transaction reference', 'sender account', 'receiver account', 'amount', 'date', 'risk score', 'risk level', 'status'];
    const rows = visibleTransactions.map((transaction) => [
      transaction.transactionRef || '',
      transaction.senderAccount || '',
      transaction.receiverAccount || '',
      String(transaction.amount ?? ''),
      transaction.occurredAt ? new Date(transaction.occurredAt).toISOString() : '',
      transaction.riskScore ?? '',
      transaction.riskLevel || '',
      transaction.fraudStatus || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? '').replace(/"/g, '""');
            return `"${value}"`;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'fraudshield-transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters = Boolean(search || riskLevel || status);

  const handleClearFilters = () => {
    setSearch('');
    setRiskLevel('');
    setStatus('');
    setPage(1);
  };

  const canCreate = hasRole('admin', 'analyst', 'investigator');

  return (
    <AppLayout title="Transactions">
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💳</span> Transaction Ledger
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              Real-time monitoring stream, risk scoring, and status assessments
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={exportCsv} disabled={!visibleTransactions.length}>
              📥 Export CSV
            </button>
            {canCreate && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                + New Transaction
              </button>
            )}
          </div>
        </div>

        {/* Compact Single-Row Toolbar */}
        <div className="table-toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search reference or account (e.g. TXN-..., ACC-...)"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>

          <select
            className="filter-select"
            value={riskLevel}
            onChange={(e) => {
              setPage(1);
              setRiskLevel(e.target.value);
            }}
          >
            <option value="">All Risk Levels</option>
            {RISK_LEVELS.map((r) => (
              <option key={r} value={r}>
                {titleCase(r)} Risk
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="filter-reset-btn"
              onClick={handleClearFilters}
              title="Reset search and filters"
            >
              ✕ Clear filters
            </button>
          )}

          <div className="results-count">
            {data?.meta?.total !== undefined
              ? `${visibleTransactions.length} of ${data.meta.total} records`
              : `${visibleTransactions.length} records`}
          </div>
        </div>

        {loading && <TableSkeleton rows={12} />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && (
          <>
            <TransactionTable transactions={visibleTransactions} sortConfig={sortConfig} onSort={setSortConfig} />
            <Pagination
              page={data?.meta?.page}
              totalPages={data?.meta?.totalPages}
              total={data?.meta?.total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {showForm && (
        <TransactionForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setPage(1);
            refetch();
          }}
        />
      )}
    </AppLayout>
  );
}
