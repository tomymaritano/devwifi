import { execa } from 'execa';
import { platform } from 'os';

const os = platform();

export async function getLatency(host = '1.1.1.1'): Promise<number> {
  try {
    const args = os === 'win32'
      ? ['-n', '3', '-w', '2000', host]
      : ['-c', '3', '-W', '2', host];

    const { stdout } = await execa('ping', args);

    if (os === 'win32') {
      const match = stdout.match(/Average\s*=\s*(\d+)ms/);
      return match ? parseInt(match[1]) : 0;
    }

    const match = stdout.match(/[\d.]+\/([\d.]+)\//);
    return match ? Math.round(parseFloat(match[1])) : 0;
  } catch {
    return -1;
  }
}

export async function getLocalIP(): Promise<string> {
  try {
    if (os === 'win32') {
      const { stdout } = await execa('ipconfig');
      const sections = stdout.split(/\r?\n\r?\n/);
      for (const section of sections) {
        if (section.includes('Wireless') || section.includes('Wi-Fi')) {
          const match = section.match(/IPv4 Address[.\s]*:\s*([\d.]+)/);
          if (match) return match[1];
        }
      }
      const fallback = stdout.match(/IPv4 Address[.\s]*:\s*([\d.]+)/);
      return fallback?.[1] ?? '';
    }

    if (os === 'darwin') {
      const { stdout } = await execa('ipconfig', ['getifaddr', 'en0']);
      return stdout.trim();
    }

    const { stdout } = await execa('hostname', ['-I']);
    return stdout.trim().split(' ')[0] ?? '';
  } catch {
    return '';
  }
}

export async function getGateway(): Promise<string> {
  try {
    if (os === 'win32') {
      const { stdout } = await execa('ipconfig');
      const match = stdout.match(/Default Gateway[.\s]*:\s*([\d.]+)/);
      return match?.[1] ?? '';
    }

    if (os === 'darwin') {
      const { stdout } = await execa('route', ['-n', 'get', 'default']);
      const match = stdout.match(/gateway:\s*([\d.]+)/);
      return match?.[1] ?? '';
    }

    const { stdout } = await execa('ip', ['route', 'show', 'default']);
    const match = stdout.match(/via\s+([\d.]+)/);
    return match?.[1] ?? '';
  } catch {
    return '';
  }
}
