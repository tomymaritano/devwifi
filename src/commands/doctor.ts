import chalk from 'chalk';
import ora from 'ora';
import { getWifiInfo, getPassword, signalQuality, estimateCongestion } from '../utils/wifi.js';
import { getLatency, getLocalIP, getGateway } from '../utils/network.js';
import { getDnsServers, describeDns } from '../utils/dns.js';
import { runSpeedTest } from '../utils/speedtest.js';

function maskPassword(password: string): string {
  if (password.length <= 4) return '****';
  return password.slice(0, 2) + '*'.repeat(password.length - 4) + password.slice(-2);
}

function colorSignal(dbm: number): string {
  const quality = signalQuality(dbm);
  if (dbm >= -50) return chalk.green(`${dbm} dBm (${quality})`);
  if (dbm >= -60) return chalk.green(`${dbm} dBm (${quality})`);
  if (dbm >= -70) return chalk.yellow(`${dbm} dBm (${quality})`);
  return chalk.red(`${dbm} dBm (${quality})`);
}

function colorLatency(ms: number): string {
  if (ms < 0) return chalk.red('timeout');
  if (ms <= 20) return chalk.green(`${ms} ms`);
  if (ms <= 50) return chalk.yellow(`${ms} ms`);
  return chalk.red(`${ms} ms`);
}

function colorSpeed(mbps: number): string {
  if (mbps >= 100) return chalk.green(`${mbps} Mbps`);
  if (mbps >= 30) return chalk.yellow(`${mbps} Mbps`);
  return chalk.red(`${mbps} Mbps`);
}

const LINE = chalk.dim('─'.repeat(48));
const LABEL_WIDTH = 14;

function row(label: string, value: string): void {
  console.log(`  ${chalk.dim(label.padEnd(LABEL_WIDTH))} ${value}`);
}

export async function doctorCommand(): Promise<void> {
  console.log();
  console.log(`  ${chalk.bold.cyan('devwifi doctor')} ${chalk.dim('— full network diagnostic')}`);
  console.log(`  ${LINE}`);
  console.log();

  const spinner = ora('Running diagnostics…').start();
  const warnings: string[] = [];

  try {
    // Phase 1: Wi-Fi info
    spinner.text = 'Checking Wi-Fi connection…';
    const info = await getWifiInfo();

    if (!info.ssid) {
      spinner.fail('Not connected to any Wi-Fi network');
      return;
    }

    // Phase 2: Password
    spinner.text = 'Retrieving password…';
    let password = '';
    try {
      password = await getPassword(info.ssid);
    } catch {
      password = '';
    }

    // Phase 3: Network info (parallel)
    spinner.text = 'Testing network…';
    const [latency, localIP, gateway, dnsServers] = await Promise.all([
      getLatency(),
      getLocalIP(),
      getGateway(),
      getDnsServers(),
    ]);

    // Phase 4: Speed test
    spinner.text = 'Running speed test…';
    let speed = { download: 0, upload: 0, latency: 0 };
    try {
      speed = await runSpeedTest();
    } catch {
      warnings.push('Speed test failed — check internet connectivity');
    }

    spinner.stop();

    // ── Output ─────────────────────────────────────────────────────

    // Connection
    console.log(`  ${chalk.bold('Connection')}`);
    row('Network', chalk.bold(info.ssid));
    if (password) {
      row('Password', chalk.dim(maskPassword(password)));
    }
    row('Security', info.security || chalk.dim('unknown'));
    if (info.bssid) row('BSSID', info.bssid);
    if (info.radioType) row('Radio', info.radioType);
    console.log();

    // Signal
    console.log(`  ${chalk.bold('Signal')}`);
    row('Strength', colorSignal(info.signal));
    if (info.channel) {
      row('Channel', String(info.channel));
      const congestion = estimateCongestion(info.channel);
      row('Congestion', congestion.includes('High') ? chalk.yellow(congestion) : chalk.green(congestion));
    }
    console.log();

    // Network
    console.log(`  ${chalk.bold('Network')}`);
    if (localIP) row('Local IP', localIP);
    if (gateway) row('Gateway', gateway);
    row('Latency', colorLatency(latency));
    console.log();

    // Speed
    console.log(`  ${chalk.bold('Speed')}`);
    row('Download', colorSpeed(speed.download));
    row('Upload', colorSpeed(speed.upload));
    console.log();

    // DNS
    console.log(`  ${chalk.bold('DNS')}`);
    if (dnsServers.length > 0) {
      for (const server of dnsServers) {
        const provider = describeDns(server);
        row('Server', provider ? `${server} ${chalk.dim(`(${provider})`)}` : server);
      }
    } else {
      row('Server', chalk.dim('not detected'));
      warnings.push('Could not detect DNS servers');
    }
    console.log();

    // Warnings
    if (info.signal < -75) {
      warnings.push('Weak signal — consider moving closer to the router');
    }
    if (latency > 100) {
      warnings.push('High latency — network may be congested');
    }
    if (latency < 0) {
      warnings.push('Ping failed — firewall may be blocking ICMP');
    }
    if (speed.download > 0 && speed.download < 10) {
      warnings.push('Slow download speed');
    }
    if (info.channel && [1, 6, 11].includes(info.channel)) {
      warnings.push('Channel congestion likely — common 2.4 GHz channel');
    }

    if (warnings.length > 0) {
      console.log(`  ${chalk.bold.yellow('Warnings')}`);
      for (const w of warnings) {
        console.log(`  ${chalk.yellow('⚠')} ${w}`);
      }
      console.log();
    } else {
      console.log(`  ${chalk.green('✓')} ${chalk.dim('No issues detected')}`);
      console.log();
    }

    console.log(`  ${LINE}`);
    console.log();
  } catch (err) {
    spinner.fail('Diagnostic failed');
    if (err instanceof Error) {
      console.log(chalk.dim(`  ${err.message}`));
    }
    console.log();
  }
}
