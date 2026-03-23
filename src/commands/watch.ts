import chalk from 'chalk';
import { getWifiInfo, signalQuality } from '../utils/wifi.js';
import { getLatency } from '../utils/network.js';
import { NetworkMonitor, formatBytes } from '../utils/monitor.js';

function moveCursor(row: number, col: number): string {
  return `\x1b[${row};${col}H`;
}

function clearScreen(): string {
  return '\x1b[2J\x1b[H';
}

function colorValue(val: number, thresholds: [number, number], higher = true): string {
  if (higher) {
    if (val >= thresholds[1]) return chalk.green(String(val));
    if (val >= thresholds[0]) return chalk.yellow(String(val));
    return chalk.red(String(val));
  }
  if (val <= thresholds[0]) return chalk.green(String(val));
  if (val <= thresholds[1]) return chalk.yellow(String(val));
  return chalk.red(String(val));
}

function sparkline(data: number[], width = 30): string {
  if (data.length === 0) return chalk.dim('░'.repeat(width));
  const max = Math.max(...data, 1);
  const blocks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const recent = data.slice(-width);
  return recent
    .map(v => {
      const idx = Math.min(Math.floor((v / max) * 7), 7);
      return chalk.cyan(blocks[idx]);
    })
    .join('');
}

export async function watchCommand(options: { interval?: string }): Promise<void> {
  const interval = parseInt(options.interval ?? '2');
  const monitor = new NetworkMonitor(interval);

  const dlHistory: number[] = [];
  const ulHistory: number[] = [];
  const latHistory: number[] = [];
  let peakDl = 0;
  let peakUl = 0;

  process.stdout.write(clearScreen());
  process.stdout.write(chalk.dim('  Starting monitor…\n'));

  monitor.onData(async (_store, { bw, lat }) => {
    dlHistory.push(bw.downloadMbps);
    ulHistory.push(bw.uploadMbps);
    if (lat.ms >= 0) latHistory.push(lat.ms);
    if (bw.downloadMbps > peakDl) peakDl = bw.downloadMbps;
    if (bw.uploadMbps > peakUl) peakUl = bw.uploadMbps;

    let wifiInfo;
    try { wifiInfo = await getWifiInfo(); } catch { wifiInfo = null; }

    const LINE = chalk.dim('─'.repeat(50));
    const L = 16;
    const lines: string[] = [];

    lines.push('');
    lines.push(`  ${chalk.bold.cyan('devwifi watch')} ${chalk.dim('— live network monitor')}`);
    lines.push(`  ${LINE}`);
    lines.push('');

    if (wifiInfo?.ssid) {
      const q = signalQuality(wifiInfo.signal);
      const sigColor = wifiInfo.signal >= -60 ? chalk.green : wifiInfo.signal >= -75 ? chalk.yellow : chalk.red;
      lines.push(`  ${chalk.dim('Network'.padEnd(L))} ${chalk.bold(wifiInfo.ssid)}`);
      lines.push(`  ${chalk.dim('Signal'.padEnd(L))} ${sigColor(`${wifiInfo.signal} dBm (${q})`)}`);
      if (wifiInfo.channel) lines.push(`  ${chalk.dim('Channel'.padEnd(L))} ${wifiInfo.channel}`);
      lines.push('');
    }

    lines.push(`  ${chalk.dim('Download'.padEnd(L))} ${colorValue(bw.downloadMbps, [10, 50], true)} ${chalk.dim('Mbps')}  ${chalk.dim('peak')} ${peakDl} Mbps`);
    lines.push(`  ${chalk.dim(''.padEnd(L))} ${sparkline(dlHistory)}`);
    lines.push('');
    lines.push(`  ${chalk.dim('Upload'.padEnd(L))} ${colorValue(bw.uploadMbps, [5, 20], true)} ${chalk.dim('Mbps')}  ${chalk.dim('peak')} ${peakUl} Mbps`);
    lines.push(`  ${chalk.dim(''.padEnd(L))} ${sparkline(ulHistory)}`);
    lines.push('');
    lines.push(`  ${chalk.dim('Latency'.padEnd(L))} ${lat.ms >= 0 ? colorValue(lat.ms, [20, 50], false) + chalk.dim(' ms') : chalk.red('timeout')}`);
    lines.push(`  ${chalk.dim(''.padEnd(L))} ${sparkline(latHistory)}`);
    lines.push('');
    lines.push(`  ${chalk.dim('Total RX'.padEnd(L))} ${formatBytes(_store.totalRx)}`);
    lines.push(`  ${chalk.dim('Total TX'.padEnd(L))} ${formatBytes(_store.totalTx)}`);
    lines.push('');
    lines.push(`  ${LINE}`);
    lines.push(chalk.dim(`  Updated ${new Date().toLocaleTimeString()} · every ${interval}s · Ctrl+C to stop`));
    lines.push('');

    process.stdout.write(clearScreen());
    process.stdout.write(lines.join('\n'));
  });

  await monitor.start();

  process.on('SIGINT', () => {
    monitor.stop();
    process.stdout.write(clearScreen());
    process.stdout.write(chalk.dim('  Monitor stopped.\n\n'));
    process.exit(0);
  });

  // Keep process alive
  await new Promise(() => {});
}
