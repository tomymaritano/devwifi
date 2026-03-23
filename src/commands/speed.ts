import chalk from 'chalk';
import ora from 'ora';
import { runSpeedTest } from '../utils/speedtest.js';

function formatSpeed(mbps: number): string {
  if (mbps >= 100) return chalk.green.bold(`${mbps} Mbps`);
  if (mbps >= 30) return chalk.yellow.bold(`${mbps} Mbps`);
  return chalk.red.bold(`${mbps} Mbps`);
}

export async function speedCommand(): Promise<void> {
  console.log();

  const spinner = ora('Testing latency…').start();

  try {
    const result = await runSpeedTest().then(r => {
      return r;
    });

    // We run it all at once but update the spinner text for UX
    spinner.text = 'Measuring download speed…';
    await new Promise(resolve => setTimeout(resolve, 50));
    spinner.text = 'Measuring upload speed…';
    await new Promise(resolve => setTimeout(resolve, 50));

    spinner.stop();

    console.log(`  ${chalk.bold('Speed Test Results')}`);
    console.log();
    console.log(`  ${chalk.dim('Latency')}    ${result.latency > 0 ? `${result.latency} ms` : chalk.red('timeout')}`);
    console.log(`  ${chalk.dim('Download')}   ${formatSpeed(result.download)}`);
    console.log(`  ${chalk.dim('Upload')}     ${formatSpeed(result.upload)}`);
    console.log();
    console.log(chalk.dim(`  Powered by Cloudflare Speed Test`));
    console.log();
  } catch (err) {
    spinner.fail('Speed test failed');
    if (err instanceof Error) {
      console.log(chalk.dim(`  ${err.message}`));
    }
    console.log();
  }
}
