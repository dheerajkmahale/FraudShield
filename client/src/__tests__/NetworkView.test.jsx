import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../hooks/useApi', () => ({
  useApi: vi.fn(),
}));

vi.mock('../layouts/AppLayout', () => ({
  default: ({ title, children }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('../components/States', () => ({
  LoadingState: ({ label }) => <div>{label}</div>,
  ErrorState: ({ message }) => <div>{message}</div>,
}));

import { useApi } from '../hooks/useApi';
import NetworkView from '../pages/NetworkView';

const mockNetworkData = {
  data: {
    nodes: [
      { id: 'A1', transactionCount: 3, suspiciousCount: 1 },
      { id: 'B2', transactionCount: 2, suspiciousCount: 1 },
      { id: 'C3', transactionCount: 1, suspiciousCount: 0 },
      { id: 'D4', transactionCount: 1, suspiciousCount: 0 },
    ],
    edges: [
      { source: 'A1', target: 'B2', amount: 120000, transactionRef: 'TX-1', suspicious: true, riskLevel: 'critical' },
      { source: 'A1', target: 'C3', amount: 90000, transactionRef: 'TX-2', suspicious: true, riskLevel: 'high' },
      { source: 'B2', target: 'D4', amount: 25000, transactionRef: 'TX-3', suspicious: false, riskLevel: 'medium' },
      { source: 'C3', target: 'D4', amount: 12000, transactionRef: 'TX-4', suspicious: false, riskLevel: 'low' },
    ],
  },
};

function getSummaryCard(label) {
  return Array.from(document.querySelectorAll('.stat-card')).find((card) => card.textContent.includes(label));
}

describe('NetworkView filters', () => {
  beforeEach(() => {
    useApi.mockReturnValue({
      data: mockNetworkData,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('updates the summary cards when the suspicious filter is selected', () => {
    render(<NetworkView />);

    fireEvent.click(screen.getByRole('button', { name: 'Suspicious' }));

    expect(getSummaryCard('Flagged')).toHaveTextContent('2');
    expect(getSummaryCard('High risk')).toHaveTextContent('2');
    expect(getSummaryCard('Critical')).toHaveTextContent('1');
  });

  it('updates the summary cards when the critical filter is selected', () => {
    render(<NetworkView />);

    fireEvent.click(screen.getByRole('button', { name: 'Critical' }));

    expect(getSummaryCard('Accounts')).toHaveTextContent('2');
    expect(getSummaryCard('Flagged')).toHaveTextContent('1');
    expect(getSummaryCard('High risk')).toHaveTextContent('1');
    expect(getSummaryCard('Critical')).toHaveTextContent('1');
  });
});
