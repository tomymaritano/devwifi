import { describe, it, expect } from 'vitest';

describe('speedtest module', () => {
  it('exports runSpeedTest function', async () => {
    const mod = await import('../src/utils/speedtest.js');
    expect(typeof mod.runSpeedTest).toBe('function');
  });
});
