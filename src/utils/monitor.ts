import { platform } from 'os';
import { readFile } from 'fs/promises';
import { execa } from 'execa';

const os = platform();

export interface NetSnapshot {
  timestamp: number;
  rxBytes: number;
  txBytes: number;
}

export interface BandwidthPoint {
  timestamp: number;
  downloadMbps: number;
  uploadMbps: number;
}

export interface LatencyPoint {
  timestamp: number;
  ms: number;
}

export interface MonitorStore {
  bandwidth: BandwidthPoint[];
  latency: LatencyPoint[];
  totalRx: number;
  totalTx: number;
  startedAt: number;
}

const MAX_POINTS = 17_280; // 24h at 5s intervals

// ── Read raw byte counters ─────────────────────────────────────────

async function linuxGetBytes(): Promise<{ rx: number; tx: number }> {
  const data = await readFile('/proc/net/dev', 'utf-8');
  let rx = 0, tx = 0;
  for (const line of data.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('lo:')) continue;
    const match = trimmed.match(/^\S+:\s*(\d+)(?:\s+\d+){7}\s+(\d+)/);
    if (match) {
      rx += parseInt(match[1]);
      tx += parseInt(match[2]);
    }
  }
  return { rx, tx };
}

async function winGetBytes(): Promise<{ rx: number; tx: number }> {
  try {
    const { stdout } = await execa('netstat', ['-e']);
    const lines = stdout.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('Bytes')) {
        const parts = line.trim().split(/\s+/);
        return {
          rx: parseInt(parts[1]) || 0,
          tx: parseInt(parts[2]) || 0,
        };
      }
    }
  } catch { /* fallback */ }
  return { rx: 0, tx: 0 };
}

async function macGetBytes(): Promise<{ rx: number; tx: number }> {
  try {
    const { stdout } = await execa('netstat', ['-ib']);
    let rx = 0, tx = 0;
    for (const line of stdout.split('\n')) {
      if (line.includes('en0') && !line.includes('Link')) {
        const parts = line.trim().split(/\s+/);
        rx += parseInt(parts[6]) || 0;
        tx += parseInt(parts[9]) || 0;
      }
    }
    return { rx, tx };
  } catch {
    return { rx: 0, tx: 0 };
  }
}

export async function getNetBytes(): Promise<{ rx: number; tx: number }> {
  if (os === 'linux') return linuxGetBytes();
  if (os === 'darwin') return macGetBytes();
  return winGetBytes();
}

// ── Latency probe ──────────────────────────────────────────────────

async function pingLatency(host: string): Promise<number> {
  try {
    const args = os === 'win32'
      ? ['-n', '1', '-w', '2000', host]
      : ['-c', '1', '-W', '2', host];
    const { stdout } = await execa('ping', args);

    if (os === 'win32') {
      const m = stdout.match(/time[=<](\d+)ms/);
      return m ? parseInt(m[1]) : -1;
    }
    const m = stdout.match(/time=([\d.]+)/);
    return m ? Math.round(parseFloat(m[1])) : -1;
  } catch {
    return -1;
  }
}

// ── Monitor class ──────────────────────────────────────────────────

export class NetworkMonitor {
  store: MonitorStore;
  private interval: ReturnType<typeof setInterval> | null = null;
  private lastSnapshot: NetSnapshot | null = null;
  private sampleMs: number;
  private pingHost: string;
  private listeners = new Set<(store: MonitorStore, latest: { bw: BandwidthPoint; lat: LatencyPoint }) => void>();

  constructor(sampleSeconds = 5, pingHost = '1.1.1.1') {
    this.sampleMs = sampleSeconds * 1000;
    this.pingHost = pingHost;
    this.store = {
      bandwidth: [],
      latency: [],
      totalRx: 0,
      totalTx: 0,
      startedAt: Date.now(),
    };
  }

  onData(fn: (store: MonitorStore, latest: { bw: BandwidthPoint; lat: LatencyPoint }) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async start() {
    const bytes = await getNetBytes();
    this.lastSnapshot = {
      timestamp: Date.now(),
      rxBytes: bytes.rx,
      txBytes: bytes.tx,
    };

    this.interval = setInterval(() => this.sample(), this.sampleMs);
    // First sample immediately
    await this.sample();
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  private async sample() {
    const now = Date.now();
    const [bytes, latency] = await Promise.all([
      getNetBytes(),
      pingLatency(this.pingHost),
    ]);

    if (this.lastSnapshot) {
      const elapsed = (now - this.lastSnapshot.timestamp) / 1000;
      const rxDiff = Math.max(0, bytes.rx - this.lastSnapshot.rxBytes);
      const txDiff = Math.max(0, bytes.tx - this.lastSnapshot.txBytes);

      const bw: BandwidthPoint = {
        timestamp: now,
        downloadMbps: Math.round((rxDiff * 8 / elapsed / 1_000_000) * 100) / 100,
        uploadMbps: Math.round((txDiff * 8 / elapsed / 1_000_000) * 100) / 100,
      };

      const lat: LatencyPoint = { timestamp: now, ms: latency };

      this.store.bandwidth.push(bw);
      this.store.latency.push(lat);
      this.store.totalRx += rxDiff;
      this.store.totalTx += txDiff;

      // Trim to max size
      if (this.store.bandwidth.length > MAX_POINTS) {
        this.store.bandwidth = this.store.bandwidth.slice(-MAX_POINTS);
      }
      if (this.store.latency.length > MAX_POINTS) {
        this.store.latency = this.store.latency.slice(-MAX_POINTS);
      }

      for (const fn of this.listeners) {
        fn(this.store, { bw, lat });
      }
    }

    this.lastSnapshot = { timestamp: now, rxBytes: bytes.rx, txBytes: bytes.tx };
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
