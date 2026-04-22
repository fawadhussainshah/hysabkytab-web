import { describe, expect, it } from 'vitest';
import { formatMoneySigned } from './format';

describe('formatMoneySigned', () => {
  it('adds plus sign for income values', () => {
    expect(formatMoneySigned(5000, 'USD', 'income')).toMatch(/^\+/);
  });

  it('adds minus sign for expense values', () => {
    expect(formatMoneySigned(5000, 'USD', 'expense')).toMatch(/^-?/);
    expect(formatMoneySigned(5000, 'USD', 'expense').startsWith('-')).toBe(
      true,
    );
  });

  it('does not add sign for transfer values', () => {
    const result = formatMoneySigned(5000, 'USD', 'transfer');
    expect(result.startsWith('+')).toBe(false);
    expect(result.startsWith('-')).toBe(false);
  });
});
