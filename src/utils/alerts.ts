import { exec } from 'child_process';
import { platform } from 'os';
import type { AlertRule, AlertsConfig } from './store.js';
import type { BandwidthPoint, LatencyPoint } from './monitor.js';

const os = platform();
const COOLDOWN_MS = 5 * 60 * 1000; // 5 min between same alert

export interface AlertEvent {
  rule: AlertRule;
  value: number;
  message: string;
  timestamp: number;
}

const recentAlerts: AlertEvent[] = [];
const MAX_ALERT_LOG = 100;

export function getAlertLog(): AlertEvent[] {
  return recentAlerts;
}

export function checkAlerts(
  config: AlertsConfig,
  bw: BandwidthPoint,
  lat: LatencyPoint,
): AlertEvent[] {
  const fired: AlertEvent[] = [];
  const now = Date.now();

  for (const rule of config.rules) {
    if (!rule.enabled) continue;
    if (rule.lastTriggered && now - rule.lastTriggered < COOLDOWN_MS) continue;

    let value: number;
    let unit: string;

    switch (rule.metric) {
      case 'latency':
        value = lat.ms;
        unit = 'ms';
        if (value < 0) continue; // skip timeout
        break;
      case 'download':
        value = bw.downloadMbps;
        unit = 'Mbps';
        break;
      case 'upload':
        value = bw.uploadMbps;
        unit = 'Mbps';
        break;
      default:
        continue;
    }

    const triggered = rule.condition === 'above'
      ? value > rule.threshold
      : value < rule.threshold;

    if (triggered) {
      const event: AlertEvent = {
        rule,
        value,
        message: `${rule.metric} is ${value}${unit} (${rule.condition} ${rule.threshold}${unit})`,
        timestamp: now,
      };
      rule.lastTriggered = now;
      fired.push(event);
      recentAlerts.unshift(event);
      if (recentAlerts.length > MAX_ALERT_LOG) recentAlerts.pop();

      if (config.desktopNotifications) sendDesktopNotification(event);
      if (rule.webhookUrl) sendWebhook(rule.webhookUrl, event);
    }
  }

  return fired;
}

function sendDesktopNotification(event: AlertEvent): void {
  const title = 'devwifi alert';
  const msg = event.message;

  try {
    if (os === 'win32') {
      exec(`powershell -Command "New-BurntToastNotification -Text '${title}','${msg}'" 2>nul`);
    } else if (os === 'darwin') {
      exec(`osascript -e 'display notification "${msg}" with title "${title}"'`);
    } else {
      exec(`notify-send "${title}" "${msg}"`);
    }
  } catch { /* best effort */ }
}

async function sendWebhook(url: string, event: AlertEvent): Promise<void> {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `⚠️ devwifi: ${event.message}`,
        timestamp: event.timestamp,
        metric: event.rule.metric,
        value: event.value,
        threshold: event.rule.threshold,
      }),
    });
  } catch { /* best effort */ }
}
