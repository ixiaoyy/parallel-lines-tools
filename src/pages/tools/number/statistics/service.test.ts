import { describe, expect, it } from 'vitest';
import {
  computeStatistics,
  formatStatistic,
  MAX_STATISTICS_CHARACTERS,
  MAX_STATISTICS_VALUES
} from './service';

describe('column statistics', () => {
  it('does not present blank input as a calculated zero', () => {
    expect(computeStatistics(' \n\t\r\n')).toEqual({ status: 'empty' });
  });

  it('calculates the six statistics together for an even-sized column', () => {
    expect(computeStatistics('1\n2\n3\n4')).toEqual({
      status: 'ready',
      count: 4,
      sum: 10,
      mean: 2.5,
      median: 2.5,
      min: 1,
      max: 4
    });
  });

  it('supports negative values, decimals and the visible example', () => {
    expect(computeStatistics('12.5\n18\n-3\n7.5')).toEqual({
      status: 'ready',
      count: 4,
      sum: 35,
      mean: 8.75,
      median: 10,
      min: -3,
      max: 18
    });
  });

  it('supports explicit decimal and scientific notation without extracting text', () => {
    expect(computeStatistics('+1e2\n-.5\n.25\n1.')).toEqual({
      status: 'ready',
      count: 4,
      sum: 100.75,
      mean: 25.1875,
      median: 0.625,
      min: -0.5,
      max: 100
    });
  });

  it('counts only numeric rows and handles both kinds of line ending', () => {
    expect(computeStatistics('1\r\n\r\n2\r3\n')).toEqual({
      status: 'ready',
      count: 3,
      sum: 6,
      mean: 2,
      median: 2,
      min: 1,
      max: 3
    });
  });

  it('reports the original row and refuses to calculate a partial result', () => {
    expect(computeStatistics('\n1\n\nbad\n2')).toEqual({
      status: 'invalid',
      error: 'invalidNumber',
      line: 4
    });
  });

  it.each([
    '1,000',
    '12kg',
    '2 3',
    'NaN',
    'Infinity',
    '0x10',
    '--1',
    '1_000',
    '一'
  ])('does not silently coerce %s', (value) => {
    expect(computeStatistics(value)).toEqual({
      status: 'invalid',
      error: 'invalidNumber',
      line: 1
    });
  });

  it.each([
    '1e309',
    '1e-999',
    '9007199254740993',
    '9007199254740991.1',
    '0.1234567890123456'
  ])('reports unsupported precision/range for %s', (value) => {
    expect(computeStatistics(value)).toEqual({
      status: 'invalid',
      error: 'outOfRange',
      line: 1
    });
  });

  it('keeps a safe integer in full and distinguishes real zero from underflow', () => {
    expect(computeStatistics('9007199254740991')).toMatchObject({
      status: 'ready',
      min: Number.MAX_SAFE_INTEGER
    });
    expect(formatStatistic(Number.MAX_SAFE_INTEGER)).toBe('9007199254740991');
    expect(computeStatistics('-0\n0e-999')).toMatchObject({
      status: 'ready',
      count: 2,
      sum: 0
    });
  });

  it('uses compensated summation for large positive/negative cancellation', () => {
    expect(
      computeStatistics('1000000000000000\n0.1\n-1000000000000000')
    ).toMatchObject({ status: 'ready', sum: 0.1 });
  });

  it('bounds both input text and numeric row count', () => {
    expect(
      computeStatistics('1'.repeat(MAX_STATISTICS_CHARACTERS + 1))
    ).toEqual({ status: 'invalid', error: 'inputTooLarge' });
    expect(
      computeStatistics(Array(MAX_STATISTICS_VALUES).fill('0').join('\n'))
    ).toMatchObject({ status: 'ready', count: MAX_STATISTICS_VALUES });
    expect(
      computeStatistics(
        Array(MAX_STATISTICS_VALUES + 1)
          .fill('0')
          .join('\n')
      )
    ).toEqual({ status: 'invalid', error: 'tooManyNumbers' });
  });

  it('formats declared floating-point output without binary tails or negative zero', () => {
    expect(formatStatistic(0.1 + 0.2)).toBe('0.3');
    expect(formatStatistic(-0)).toBe('0');
    expect(formatStatistic(1 / 3)).toBe('0.333333333333333');
  });
});
