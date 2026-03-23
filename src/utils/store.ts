import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { BandwidthPoint, LatencyPoint } from './monitor.js';

const DATA_DIR = join(homedir(), '.devwifi');
const DB_FILE = join(DATA_DIR, 'history.json');
const ALERTS_FILE = join(DATA_DIR, 'alerts.json');
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface HistoryData {
  bandwidth: BandwidthPoint[];
  latency: LatencyPoint[];
  totalRx: number;
  totalTx: number;
}

export interface AlertRule {
  id: string;
  enabled: boolean;
  metric: 'latency' | 'download' | 'upload' | 'packetLoss';
  condition: 'above' | 'below';
  threshold: number;
  webhookUrl?: string;
  lastTriggered?: number;
}

export interface AlertsConfig {
  rules: AlertRule[];
  desktopNotifications: boolean;
}

async function ensureDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

// ── History ────────────────────────────────────────────────────────

export async function loadHistory(): Promise<HistoryData> {
  try {
    const raw = await readFile(DB_FILE, 'utf-8');
    const data = JSON.parse(raw) as HistoryData;
    const cutoff = Date.now() - MAX_AGE_MS;
    data.bandwidth = data.bandwidth.filter(p => p.timestamp > cutoff);
    data.latency = data.latency.filter(p => p.timestamp > cutoff);
    return data;
  } catch {
    return { bandwidth: [], latency: [], totalRx: 0, totalTx: 0 };
  }
}

export async function saveHistory(data: HistoryData): Promise<void> {
  await ensureDir();
  const cutoff = Date.now() - MAX_AGE_MS;
  const trimmed: HistoryData = {
    bandwidth: data.bandwidth.filter(p => p.timestamp > cutoff),
    latency: data.latency.filter(p => p.timestamp > cutoff),
    totalRx: data.totalRx,
    totalTx: data.totalTx,
  };
  await writeFile(DB_FILE, JSON.stringify(trimmed));
}

// ── Alerts ─────────────────────────────────────────────────────────

export async function loadAlerts(): Promise<AlertsConfig> {
  try {
    const raw = await readFile(ALERTS_FILE, 'utf-8');
    return JSON.parse(raw) as AlertsConfig;
  } catch {
    return {
      rules: [
        { id: 'lat-high', enabled: true, metric: 'latency', condition: 'above', threshold: 100 },
        { id: 'dl-low', enabled: true, metric: 'download', condition: 'below', threshold: 5 },
      ],
      desktopNotifications: true,
    };
  }
}

export async function saveAlerts(config: AlertsConfig): Promise<void> {
  await ensureDir();
  await writeFile(ALERTS_FILE, JSON.stringify(config, null, 2));
}
