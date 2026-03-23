import { describe, it, expect } from 'vitest';
import { signalQuality, percentToDbm, estimateCongestion } from '../src/utils/wifi.js';

describe('signalQuality', () => {
  it('returns Excellent for strong signals', () => {
    expect(signalQuality(-30)).toBe('Excellent');
    expect(signalQuality(-49)).toBe('Excellent');
    expect(signalQuality(-50)).toBe('Excellent');
  });

  it('returns Good for moderate signals', () => {
    expect(signalQuality(-51)).toBe('Good');
    expect(signalQuality(-60)).toBe('Good');
  });

  it('returns Fair for weaker signals', () => {
    expect(signalQuality(-61)).toBe('Fair');
    expect(signalQuality(-70)).toBe('Fair');
  });

  it('returns Weak for poor signals', () => {
    expect(signalQuality(-71)).toBe('Weak');
    expect(signalQuality(-80)).toBe('Weak');
  });

  it('returns Very Weak for very poor signals', () => {
    expect(signalQuality(-81)).toBe('Very Weak');
    expect(signalQuality(-100)).toBe('Very Weak');
  });
});

describe('percentToDbm', () => {
  it('converts 100% to -50 dBm', () => {
    expect(percentToDbm(100)).toBe(-50);
  });

  it('converts 50% to -75 dBm', () => {
    expect(percentToDbm(50)).toBe(-75);
  });

  it('converts 0% to -100 dBm', () => {
    expect(percentToDbm(0)).toBe(-100);
  });

  it('converts 80% to -60 dBm', () => {
    expect(percentToDbm(80)).toBe(-60);
  });
});

describe('estimateCongestion', () => {
  it('reports high congestion for common channels', () => {
    expect(estimateCongestion(1)).toContain('High');
    expect(estimateCongestion(6)).toContain('High');
    expect(estimateCongestion(11)).toContain('High');
  });

  it('reports low congestion for uncommon channels', () => {
    expect(estimateCongestion(3)).toContain('Low');
    expect(estimateCongestion(36)).toContain('Low');
    expect(estimateCongestion(149)).toContain('Low');
  });
});
