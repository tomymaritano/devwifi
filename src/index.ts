#!/usr/bin/env node

import { Command } from 'commander';
import { passCommand } from './commands/pass.js';
import { qrCommand } from './commands/qr.js';
import { listCommand } from './commands/list.js';
import { signalCommand } from './commands/signal.js';
import { speedCommand } from './commands/speed.js';
import { dnsCommand, dnsFixCommand } from './commands/dns.js';
import { doctorCommand } from './commands/doctor.js';
import { uiCommand } from './commands/ui.js';
import { monitorCommand } from './commands/monitor.js';
import { watchCommand } from './commands/watch.js';

const program = new Command();

program
  .name('devwifi')
  .description('Developer CLI for diagnosing, inspecting, and sharing Wi-Fi')
  .version('1.0.0');

program
  .command('pass')
  .description('Show the password of a Wi-Fi network')
  .argument('[network]', 'Network name (defaults to current)')
  .option('-c, --copy', 'Copy password to clipboard')
  .action(passCommand);

program
  .command('qr')
  .description('Generate a QR code to share the current Wi-Fi network')
  .action(qrCommand);

program
  .command('list')
  .description('List saved Wi-Fi networks')
  .action(listCommand);

program
  .command('signal')
  .description('Show Wi-Fi signal strength')
  .action(signalCommand);

program
  .command('speed')
  .description('Run a network speed test')
  .action(speedCommand);

const dns = program
  .command('dns')
  .description('Show or fix DNS configuration');

dns
  .command('show', { isDefault: true })
  .description('Show current DNS servers')
  .action(dnsCommand);

dns
  .command('fix')
  .description('Switch DNS to Cloudflare (1.1.1.1)')
  .action(dnsFixCommand);

program
  .command('doctor')
  .description('Run a full network diagnostic')
  .action(doctorCommand);

program
  .command('ui')
  .description('Open a visual dashboard in the browser')
  .option('-p, --port <port>', 'Port number', '3141')
  .action(uiCommand);

program
  .command('monitor')
  .description('Continuous network monitoring with live dashboard')
  .option('-p, --port <port>', 'Port number', '3142')
  .option('-i, --interval <seconds>', 'Sample interval in seconds', '5')
  .action(monitorCommand);

program
  .command('watch')
  .description('Live network stats in the terminal')
  .option('-i, --interval <seconds>', 'Refresh interval in seconds', '2')
  .action(watchCommand);

program.parse();
