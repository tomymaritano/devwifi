import chalk from 'chalk';
import ora from 'ora';
import { listSavedNetworks } from '../utils/wifi.js';

export async function listCommand(): Promise<void> {
  const spinner = ora('Loading saved networks…').start();

  try {
    const networks = await listSavedNetworks();

    if (networks.length === 0) {
      spinner.warn('No saved networks found');
      return;
    }

    spinner.stop();

    console.log();
    console.log(`  ${chalk.bold('Saved Wi-Fi Networks')} ${chalk.dim(`(${networks.length})`)}`);
    console.log();

    for (let i = 0; i < networks.length; i++) {
      const num = chalk.dim(`${String(i + 1).padStart(2)}.`);
      console.log(`  ${num} ${networks[i].name}`);
    }

    console.log();
  } catch (err) {
    spinner.fail('Failed to list networks');
    if (err instanceof Error) {
      console.log(chalk.dim(`  ${err.message}`));
    }
  }
}
