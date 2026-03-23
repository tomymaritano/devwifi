import chalk from 'chalk';
import ora from 'ora';
import { getDnsServers, setDns, describeDns } from '../utils/dns.js';

export async function dnsCommand(): Promise<void> {
  const spinner = ora('Reading DNS configuration…').start();

  try {
    const servers = await getDnsServers();

    if (servers.length === 0) {
      spinner.warn('Could not detect DNS servers');
      return;
    }

    spinner.stop();

    console.log();
    console.log(`  ${chalk.bold('DNS Servers')}`);
    console.log();

    for (const server of servers) {
      const provider = describeDns(server);
      const label = provider ? chalk.dim(` (${provider})`) : '';
      console.log(`  ${chalk.cyan('●')} ${server}${label}`);
    }

    console.log();
  } catch (err) {
    spinner.fail('Failed to read DNS configuration');
    if (err instanceof Error) {
      console.log(chalk.dim(`  ${err.message}`));
    }
  }
}

export async function dnsFixCommand(): Promise<void> {
  const spinner = ora('Switching DNS to Cloudflare (1.1.1.1)…').start();

  try {
    await setDns('1.1.1.1', '1.0.0.1');
    spinner.succeed('DNS updated to Cloudflare');

    console.log();
    console.log(`  ${chalk.cyan('●')} 1.1.1.1  ${chalk.dim('(Cloudflare)')}`);
    console.log(`  ${chalk.cyan('●')} 1.0.0.1  ${chalk.dim('(Cloudflare secondary)')}`);
    console.log();
    console.log(chalk.dim('  You may need to restart your browser for changes to take effect.'));
    console.log();
  } catch (err) {
    spinner.fail('Failed to update DNS');
    console.log(chalk.dim('  This command requires administrator privileges.'));
    if (err instanceof Error) {
      console.log(chalk.dim(`  ${err.message}`));
    }
    console.log();
  }
}
