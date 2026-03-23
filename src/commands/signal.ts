import chalk from 'chalk';
import ora from 'ora';
import { getWifiInfo, signalQuality } from '../utils/wifi.js';

function signalBar(dbm: number): string {
  const bars = 5;
  let filled: number;

  if (dbm >= -50) filled = 5;
  else if (dbm >= -60) filled = 4;
  else if (dbm >= -67) filled = 3;
  else if (dbm >= -75) filled = 2;
  else if (dbm >= -85) filled = 1;
  else filled = 0;

  const quality = signalQuality(dbm);
  const color = filled >= 4 ? chalk.green
    : filled >= 3 ? chalk.yellow
    : chalk.red;

  const bar = color('█'.repeat(filled)) + chalk.dim('░'.repeat(bars - filled));
  return `${bar} ${color(quality)}`;
}

export async function signalCommand(): Promise<void> {
  const spinner = ora('Measuring signal strength…').start();

  try {
    const info = await getWifiInfo();

    if (!info.ssid) {
      spinner.fail('Not connected to any Wi-Fi network');
      return;
    }

    spinner.stop();

    console.log();
    console.log(`  ${chalk.dim('Network')}    ${chalk.bold(info.ssid)}`);
    console.log(`  ${chalk.dim('Signal')}     ${info.signal} dBm`);
    console.log(`  ${chalk.dim('Quality')}    ${signalBar(info.signal)}`);
    if (info.channel) {
      console.log(`  ${chalk.dim('Channel')}    ${info.channel}`);
    }
    if (info.bssid) {
      console.log(`  ${chalk.dim('BSSID')}      ${info.bssid}`);
    }
    if (info.radioType) {
      console.log(`  ${chalk.dim('Radio')}      ${info.radioType}`);
    }
    console.log();
  } catch (err) {
    spinner.fail('Failed to read signal strength');
    if (err instanceof Error) {
      console.log(chalk.dim(`  ${err.message}`));
    }
  }
}
