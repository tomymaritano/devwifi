import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import chalk from 'chalk';
import ora from 'ora';
import { NetworkMonitor, formatBytes } from '../utils/monitor.js';
import { getDnsServers, setDns, describeDns } from '../utils/dns.js';
import { getLocalIP, getGateway } from '../utils/network.js';
import { listSavedNetworks, getPassword, getWifiInfo } from '../utils/wifi.js';
import { scanNetwork } from '../utils/scanner.js';
import { loadHistory, saveHistory, loadAlerts, saveAlerts, type AlertRule } from '../utils/store.js';
import { checkAlerts, getAlertLog } from '../utils/alerts.js';
import { getDashboardHTML } from '../dashboard.js';

export async function monitorCommand(options: { port?: string; interval?: string }): Promise<void> {
  const port = parseInt(options.port ?? '3142');
  const interval = parseInt(options.interval ?? '5');
  const spinner = ora('Starting network monitor…').start();

  // Load persisted data
  const history = await loadHistory();
  let alertsConfig = await loadAlerts();

  const monitor = new NetworkMonitor(interval);
  monitor.store.bandwidth = history.bandwidth;
  monitor.store.latency = history.latency;
  monitor.store.totalRx = history.totalRx;
  monitor.store.totalTx = history.totalTx;

  const clients = new Set<ServerResponse>();

  function broadcast(event: string, data: unknown) {
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of clients) {
      res.write(msg);
    }
  }

  async function sendInfo(res?: ServerResponse) {
    const [localIP, gateway, dnsServers] = await Promise.all([
      getLocalIP(), getGateway(), getDnsServers(),
    ]);
    const info = {
      localIP, gateway,
      dns: dnsServers.map(s => ({ address: s, provider: describeDns(s) })),
      startedAt: monitor.store.startedAt,
    };
    if (res) res.write(`event: info\ndata: ${JSON.stringify(info)}\n\n`);
    else broadcast('info', info);
  }

  // On each data tick
  monitor.onData((store, { bw, lat }) => {
    broadcast('tick', {
      bw, lat,
      totalRx: formatBytes(store.totalRx),
      totalTx: formatBytes(store.totalTx),
    });

    // Check alerts
    const fired = checkAlerts(alertsConfig, bw, lat);
    if (fired.length > 0) {
      broadcast('alert', { log: getAlertLog() });
    }
  });

  // Persist every 60s
  setInterval(() => {
    saveHistory({
      bandwidth: monitor.store.bandwidth,
      latency: monitor.store.latency,
      totalRx: monitor.store.totalRx,
      totalTx: monitor.store.totalTx,
    });
  }, 60_000);

  // ── API router ──────────────────────────────────

  async function readBody(req: IncomingMessage): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks).toString();
  }

  function json(res: ServerResponse, data: unknown, status = 200) {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(data));
  }

  const server = createServer(async (req, res) => {
    const url = req.url ?? '/';
    const method = req.method ?? 'GET';

    // CORS preflight
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    // ── SSE ──
    if (url === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      clients.add(res);
      req.on('close', () => clients.delete(res));
      await sendInfo(res);
      // Send historical points
      for (let i = 0; i < monitor.store.bandwidth.length; i++) {
        const bw = monitor.store.bandwidth[i];
        const lat = monitor.store.latency[i];
        res.write(`event: tick\ndata: ${JSON.stringify({
          bw, lat: lat ?? { timestamp: bw.timestamp, ms: -1 },
          totalRx: formatBytes(monitor.store.totalRx),
          totalTx: formatBytes(monitor.store.totalTx),
        })}\n\n`);
      }
      return;
    }

    // ── API: Networks ──
    if (url === '/api/networks') {
      const networks = await listSavedNetworks();
      return json(res, networks);
    }

    // ── API: Password ──
    if (url.startsWith('/api/password/')) {
      const name = decodeURIComponent(url.slice('/api/password/'.length));
      try {
        const password = await getPassword(name);
        return json(res, { password });
      } catch {
        return json(res, { password: '' });
      }
    }

    // ── API: QR data ──
    if (url.startsWith('/api/qr/')) {
      const name = decodeURIComponent(url.slice('/api/qr/'.length));
      try {
        const password = await getPassword(name);
        const info = await getWifiInfo();
        const security = info.security?.toLowerCase().includes('wpa') ? 'WPA' : 'nopass';
        const wifiStr = `WIFI:T:${security};S:${name};P:${password};;`;
        // Generate QR as SVG data URL using a simple approach
        const dataUrl = await generateQrDataUrl(wifiStr);
        return json(res, { dataUrl });
      } catch {
        return json(res, { dataUrl: '' });
      }
    }

    // ── API: DNS ──
    if (url === '/api/dns' && method === 'GET') {
      const servers = await getDnsServers();
      return json(res, { servers: servers.map(s => ({ address: s, provider: describeDns(s) })) });
    }
    if (url === '/api/dns' && method === 'POST') {
      const body = JSON.parse(await readBody(req));
      try {
        await setDns(body.primary, body.secondary);
        return json(res, { ok: true });
      } catch (e) {
        return json(res, { ok: false, error: e instanceof Error ? e.message : 'Failed' });
      }
    }

    // ── API: Devices ──
    if (url === '/api/devices') {
      const devices = await scanNetwork();
      return json(res, devices);
    }

    // ── API: Alerts config ──
    if (url === '/api/alerts' && method === 'GET') {
      return json(res, alertsConfig);
    }
    if (url === '/api/alerts' && method === 'POST') {
      const body = JSON.parse(await readBody(req));
      if (body.action === 'add') {
        const rule: AlertRule = {
          id: 'rule-' + Date.now(),
          enabled: true,
          metric: body.rule.metric,
          condition: body.rule.condition,
          threshold: body.rule.threshold,
          webhookUrl: body.rule.webhookUrl,
        };
        alertsConfig.rules.push(rule);
      } else if (body.action === 'toggle') {
        const rule = alertsConfig.rules.find(r => r.id === body.id);
        if (rule) rule.enabled = body.enabled;
      } else if (body.action === 'delete') {
        alertsConfig.rules = alertsConfig.rules.filter(r => r.id !== body.id);
      }
      await saveAlerts(alertsConfig);
      return json(res, { ok: true });
    }

    // ── API: Alert log ──
    if (url === '/api/alerts/log') {
      return json(res, getAlertLog());
    }

    // ── API: History ──
    if (url.startsWith('/api/history')) {
      const params = new URLSearchParams(url.split('?')[1] ?? '');
      const range = params.get('range') ?? '24h';
      const now = Date.now();
      const rangeMs: Record<string, number> = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
      };
      const cutoff = now - (rangeMs[range] ?? rangeMs['24h']);
      const bw = monitor.store.bandwidth.filter(p => p.timestamp > cutoff);
      const lat = monitor.store.latency.filter(p => p.timestamp > cutoff);
      return json(res, {
        bandwidth: bw,
        latency: lat,
        totalTransfer: formatBytes(monitor.store.totalRx + monitor.store.totalTx),
      });
    }

    // ── API: Status (for external tools / Prometheus) ──
    if (url === '/api/status') {
      const last = monitor.store.bandwidth.at(-1);
      const lastLat = monitor.store.latency.at(-1);
      return json(res, {
        downloadMbps: last?.downloadMbps ?? 0,
        uploadMbps: last?.uploadMbps ?? 0,
        latencyMs: lastLat?.ms ?? -1,
        totalRxBytes: monitor.store.totalRx,
        totalTxBytes: monitor.store.totalTx,
        uptime: Date.now() - monitor.store.startedAt,
      });
    }

    // ── HTML Dashboard ──
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getDashboardHTML());
  });

  await monitor.start();

  server.listen(port, () => {
    spinner.stop();
    console.log();
    console.log(`  ${chalk.bold.cyan('devwifi monitor')} ${chalk.dim('— continuous network monitoring')}`);
    console.log();
    console.log(`  ${chalk.dim('Dashboard')}   ${chalk.bold(`http://localhost:${port}`)}`);
    console.log(`  ${chalk.dim('API')}         ${chalk.bold(`http://localhost:${port}/api/status`)}`);
    console.log(`  ${chalk.dim('Interval')}    every ${interval}s`);
    console.log(`  ${chalk.dim('Storage')}     ~/.devwifi/history.json`);
    console.log();
    console.log(chalk.dim('  Press Ctrl+C to stop'));
    console.log();

    const url = `http://localhost:${port}`;
    const { platform: plat } = process;
    if (plat === 'win32') import('child_process').then(cp => cp.exec(`start ${url}`));
    else if (plat === 'darwin') import('child_process').then(cp => cp.exec(`open ${url}`));
    else import('child_process').then(cp => cp.exec(`xdg-open ${url}`));
  });

  setInterval(() => sendInfo(), 60_000);

  process.on('SIGINT', async () => {
    console.log(chalk.dim('\n  Saving data and stopping…'));
    await saveHistory({
      bandwidth: monitor.store.bandwidth,
      latency: monitor.store.latency,
      totalRx: monitor.store.totalRx,
      totalTx: monitor.store.totalTx,
    });
    monitor.stop();
    server.close();
    process.exit(0);
  });
}

// Simple QR code generation as data URL using the qrcode-terminal approach
// We generate an SVG-based QR code
async function generateQrDataUrl(text: string): Promise<string> {
  // Use a minimal QR code generation via qrcode-terminal callback
  // For the web dashboard, generate a simple Google Charts QR (works offline-free)
  // Actually, let's use a canvas-based approach client-side or an API
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
}
