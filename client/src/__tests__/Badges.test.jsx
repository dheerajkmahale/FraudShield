import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RiskBadge, FraudStatusBadge, StatusBadge } from '../components/Badges';

describe('RiskBadge', () => {
  it('renders the correct label for a known risk level', () => {
    render(<RiskBadge level="critical" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('falls back gracefully for an unknown level', () => {
    render(<RiskBadge level={undefined} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});

describe('FraudStatusBadge', () => {
  it('renders confirmed fraud status with spaces instead of underscores', () => {
    render(<FraudStatusBadge status="confirmed_fraud" />);
    expect(screen.getByText('Confirmed Fraud')).toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  it('renders investigation status correctly', () => {
    render(<StatusBadge status="under_investigation" />);
    expect(screen.getByText('Under Investigation')).toBeInTheDocument();
  });
});
