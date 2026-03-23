import { monitorCommand } from './monitor.js';

export async function uiCommand(options: { port?: string }): Promise<void> {
  await monitorCommand({ port: options.port ?? '3142', interval: '5' });
}
