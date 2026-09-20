import { describe, it, expect } from 'vitest';
import { formatCurrency, titleCase } from '../utils/format';

describe('formatCurrency', () => {
  it('formats a number as INR currency', () => {
    expect(formatCurrency(1000)).toContain('1,000');
  });

  it('returns a dash for null/undefined amounts', () => {
    expect(formatCurrency(null)).toBe('-');
    expect(formatCurrency(undefined)).toBe('-');
  });
});

describe('titleCase', () => {
  it('converts snake_case to Title Case', () => {
    expect(titleCase('under_investigation')).toBe('Under Investigation');
  });

  it('handles already-clean strings', () => {
    expect(titleCase('low')).toBe('Low');
  });
});
