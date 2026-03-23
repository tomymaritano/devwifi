import { describe, it, expect } from 'vitest';
import { getLatency, getLocalIP, getGateway } from '../src/utils/network.js';

describe('network utilities', () => {
  it('getLatency returns a number', async () => {
    const latency = await getLatency();
    expect(typeof latency).toBe('number');
  });

  it('getLocalIP returns a string', async () => {
    const ip = await getLocalIP();
    expect(typeof ip).toBe('string');
  });

  it('getGateway returns a string', async () => {
    const gw = await getGateway();
    expect(typeof gw).toBe('string');
  });
});
