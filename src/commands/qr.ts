import chalk from 'chalk';
import ora from 'ora';
import qrcode from 'qrcode-terminal';
import { getSSID, getPassword, getWifiInfo } from '../utils/wifi.js';

function generateWifiString(ssid: string, password: string, security: string): string {
  const authType = security.toLowerCase().includes('wpa') ? 'WPA'
    : security.toLowerCase().includes('wep') ? 'WEP'
    : 'nopass';

  return `WIFI:T:${authType};S:${ssid};P:${password};;`;
}

export async function qrCommand(): Promise<void> {
  const spinner = ora('Generating Wi-Fi QR code…').start();

  try {
    const [ssid, info] = await Promise.all([getSSID(), getWifiInfo()]);
    if (!ssid) {
      spinner.fail('Not connected to any Wi-Fi network');
      return;
    }

    const password = await getPassword(ssid);
    if (!password) {
      spinner.fail(`Could not retrieve password for ${chalk.bold(ssid)}`);
      return;
    }

    const wifiString = generateWifiString(ssid, password, info.security);

    spinner.stop();

    console.log();
    console.log(`  ${chalk.dim('Network')} ${chalk.bold(ssid)}`);
    console.log(`  ${chalk.dim('Scan this QR code to connect:')}`);
    console.log();

    qrcode.generate(wifiString, { small: true }, (qr: string) => {
      const lines = qr.split('\n');
      for (const line of lines) {
        console.log(`  ${line}`);
      }
      console.log();
    });
  } catch (err) {
    spinner.fail('Failed to generate QR code');
    if (err instanceof Error) {
      console.log(chalk.dim(`  ${err.message}`));
    }
  }
}
