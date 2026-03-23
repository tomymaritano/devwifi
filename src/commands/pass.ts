import chalk from 'chalk';
import ora from 'ora';
import { getSSID, getPassword } from '../utils/wifi.js';

export async function passCommand(networkName: string | undefined, options: { copy?: boolean }): Promise<void> {
  const spinner = ora('Fetching Wi-Fi password…').start();

  try {
    const ssid = networkName ?? await getSSID();
    if (!ssid) {
      spinner.fail('Not connected to any Wi-Fi network');
      console.log(chalk.dim('  Tip: specify a saved network name — devwifi pass "NetworkName"'));
      return;
    }

    spinner.text = `Fetching password for ${ssid}…`;
    const password = await getPassword(ssid);
    if (!password) {
      spinner.fail(`Could not retrieve password for ${chalk.bold(ssid)}`);
      console.log(chalk.dim('  This may require administrator privileges.'));
      return;
    }

    spinner.stop();

    console.log();
    console.log(`  ${chalk.dim('Network')}  ${chalk.bold(ssid)}`);
    console.log(`  ${chalk.dim('Password')} ${chalk.green.bold(password)}`);

    if (options.copy) {
      const { default: clipboardy } = await import('clipboardy');
      await clipboardy.write(password);
      console.log();
      console.log(`  ${chalk.dim('Copied to clipboard')} ${chalk.green('✓')}`);
    }

    console.log();
  } catch (err) {
    spinner.fail('Failed to retrieve password');
    if (err instanceof Error) {
      console.log(chalk.dim(`  ${err.message}`));
    }
  }
}
