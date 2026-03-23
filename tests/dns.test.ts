import { describe, it, expect } from 'vitest';
import { describeDns } from '../src/utils/dns.js';

describe('describeDns', () => {
  it('identifies Cloudflare DNS', () => {
    expect(describeDns('1.1.1.1')).toBe('Cloudflare');
    expect(describeDns('1.0.0.1')).toBe('Cloudflare (secondary)');
  });

  it('identifies Google DNS', () => {
    expect(describeDns('8.8.8.8')).toBe('Google');
    expect(describeDns('8.8.4.4')).toBe('Google (secondary)');
  });

  it('identifies Quad9 DNS', () => {
    expect(describeDns('9.9.9.9')).toBe('Quad9');
  });

  it('identifies OpenDNS', () => {
    expect(describeDns('208.67.222.222')).toBe('OpenDNS');
  });

  it('returns empty string for unknown servers', () => {
    expect(describeDns('192.168.1.1')).toBe('');
    expect(describeDns('10.0.0.1')).toBe('');
  });
});
