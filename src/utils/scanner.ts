import { execa } from 'execa';
import { platform } from 'os';

const os = platform();

export interface NetworkDevice {
  ip: string;
  mac: string;
  hostname: string;
  type: string;
}

export async function scanNetwork(): Promise<NetworkDevice[]> {
  const devices: NetworkDevice[] = [];

  try {
    const { stdout } = await execa('arp', ['-a']);

    for (const line of stdout.split('\n')) {
      if (os === 'win32') {
        const match = line.trim().match(/^\s*([\d.]+)\s+([\da-f-]+)\s+(\w+)/i);
        if (match && !match[2].includes('ff-ff-ff-ff')) {
          devices.push({
            ip: match[1],
            mac: match[2].replace(/-/g, ':'),
            hostname: '',
            type: guessDeviceType(match[2]),
          });
        }
      } else {
        const match = line.match(/(\S+)\s+\(([\d.]+)\)\s+at\s+([\da-f:]+)/i);
        if (match && match[3] !== 'ff:ff:ff:ff:ff:ff') {
          devices.push({
            ip: match[2],
            mac: match[3],
            hostname: match[1] === '?' ? '' : match[1],
            type: guessDeviceType(match[3]),
          });
        }
      }
    }
  } catch { /* arp not available */ }

  // Try hostname resolution for Windows
  if (os === 'win32') {
    for (const dev of devices) {
      if (!dev.hostname) {
        try {
          const { stdout } = await execa('nbtstat', ['-A', dev.ip]);
          const match = stdout.match(/^\s*(\S+)\s+<00>\s+UNIQUE/m);
          if (match) dev.hostname = match[1].toLowerCase();
        } catch { /* skip */ }
      }
    }
  }

  return devices;
}

// OUI prefix guessing (simplified)
function guessDeviceType(mac: string): string {
  const prefix = mac.replace(/[-:]/g, '').substring(0, 6).toUpperCase();
  const oui: Record<string, string> = {
    'A4C3F0': 'Apple', 'A860B6': 'Apple', '3C22FB': 'Apple',
    'DC56E7': 'Apple', 'F0D1A9': 'Apple', '6C96CF': 'Apple',
    'B868A3': 'Samsung', 'A890CE': 'Samsung', '84119E': 'Samsung',
    'E8610D': 'Google', 'F4F5D8': 'Google', '54609A': 'Google',
    '5C8D4E': 'Amazon', 'FC65DE': 'Amazon', 'A002DC': 'Amazon',
    'B0A737': 'Roku', '88DE7C': 'Tp-Link', 'E894F6': 'Tp-Link',
    '44D9E7': 'Ubiquiti', '802AA8': 'Ubiquiti',
    '001A2B': 'Cisco', '00264A': 'Cisco',
  };
  return oui[prefix] ?? 'Unknown';
}
