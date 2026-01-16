import { describe, expect, it } from 'vitest';
import {
  parseISO8601Period,
  getPeriodRank,
  comparePeriods,
  isPeriodGreaterOrEqual,
} from './period-parser';

describe('parseISO8601Period', () => {
  it('parses weekly durations', () => {
    expect(parseISO8601Period('P1W')).toBe('weekly');
    expect(parseISO8601Period('P7D')).toBe('weekly');
    expect(parseISO8601Period('p1w')).toBe('weekly'); // lowercase
  });

  it('parses monthly durations', () => {
    expect(parseISO8601Period('P1M')).toBe('monthly');
    expect(parseISO8601Period('p1m')).toBe('monthly'); // lowercase
  });

  it('parses quarterly durations', () => {
    expect(parseISO8601Period('P3M')).toBe('quarterly');
  });

  it('parses yearly durations', () => {
    expect(parseISO8601Period('P1Y')).toBe('yearly');
    expect(parseISO8601Period('P12M')).toBe('yearly');
  });

  it('returns lifetime for null/undefined', () => {
    expect(parseISO8601Period(null)).toBe('lifetime');
    expect(parseISO8601Period(undefined)).toBe('lifetime');
    expect(parseISO8601Period('')).toBe('lifetime');
  });

  it('handles complex day-based durations', () => {
    expect(parseISO8601Period('P30D')).toBe('monthly');
    expect(parseISO8601Period('P365D')).toBe('yearly');
  });
});

describe('getPeriodRank', () => {
  it('returns correct ranks', () => {
    expect(getPeriodRank('weekly')).toBe(1);
    expect(getPeriodRank('monthly')).toBe(2);
    expect(getPeriodRank('quarterly')).toBe(3);
    expect(getPeriodRank('yearly')).toBe(4);
    expect(getPeriodRank('lifetime')).toBe(5);
  });
});

describe('comparePeriods', () => {
  it('compares periods correctly', () => {
    expect(comparePeriods('weekly', 'monthly')).toBeLessThan(0);
    expect(comparePeriods('yearly', 'monthly')).toBeGreaterThan(0);
    expect(comparePeriods('monthly', 'monthly')).toBe(0);
  });
});

describe('isPeriodGreaterOrEqual', () => {
  it('returns true for greater or equal periods', () => {
    expect(isPeriodGreaterOrEqual('yearly', 'monthly')).toBe(true);
    expect(isPeriodGreaterOrEqual('monthly', 'monthly')).toBe(true);
    expect(isPeriodGreaterOrEqual('weekly', 'monthly')).toBe(false);
  });
});
