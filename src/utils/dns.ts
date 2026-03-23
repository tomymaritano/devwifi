import { execa } from 'execa';
import { readFile } from 'fs/promises';
import { platform } from 'os';

const os = platform();

export async function getDnsServers(): Promise<string[]> {
  try {
    if (os === 'win32') {
      const { stdout } = await execa('netsh', ['interface', 'ip', 'show', 'dns']);
      const matches = [...stdout.matchAll(/(?:DNS Servers|Statically Configured DNS Servers).*?:\s*([\d.]+)/g)];

      if (matches.length === 0) {
        const { stdout: ipconfig } = await execa('ipconfig', ['/all']);
        const dnsMatches = [...ipconfig.matchAll(/DNS Servers[.\s]*:\s*([\d.]+(?:\s*[\d.]+)*)/g)];
        return dnsMatches
          .flatMap(m => m[1].split(/\s+/))
          .filter(Boolean);
      }

      return matches.map(m => m[1]);
    }

    if (os === 'darwin') {
      const { stdout } = await execa('networksetup', ['-getdnsservers', 'Wi-Fi']);
      if (stdout.includes("aren't any")) {
        const { stdout: scutil } = await execa('scutil', ['--dns']);
        const matches = [...scutil.matchAll(/nameserver\[\d+\]\s*:\s*([\d.]+)/g)];
        return [...new Set(matches.map(m => m[1]))];
      }
      return stdout.split('\n').map(s => s.trim()).filter(Boolean);
    }

    // Linux
    const resolv = await readFile('/etc/resolv.conf', 'utf-8');
    const matches = [...resolv.matchAll(/nameserver\s+([\d.]+)/g)];
    return matches.map(m => m[1]);
  } catch {
    return [];
  }
}

export async function setDns(
  primary: string,
  secondary: string,
  iface?: string,
): Promise<void> {
  if (os === 'win32') {
    const name = iface ?? 'Wi-Fi';
    await execa('netsh', [
      'interface', 'ip', 'set', 'dns',
      `name=${name}`, 'static', primary,
    ]);
    await execa('netsh', [
      'interface', 'ip', 'add', 'dns',
      `name=${name}`, secondary, 'index=2',
    ]);
    return;
  }

  if (os === 'darwin') {
    const name = iface ?? 'Wi-Fi';
    await execa('networksetup', ['-setdnsservers', name, primary, secondary]);
    return;
  }

  // Linux — nmcli
  const conn = iface ?? await getActiveConnection();
  await execa('nmcli', ['connection', 'modify', conn, 'ipv4.dns', `${primary} ${secondary}`]);
  await execa('nmcli', ['connection', 'up', conn]);
}

async function getActiveConnection(): Promise<string> {
  const { stdout } = await execa('nmcli', ['-t', '-f', 'NAME,TYPE,DEVICE', 'connection', 'show', '--active']);
  const line = stdout.split('\n').find(l => l.includes('wireless') || l.includes('wifi'));
  return line?.split(':')[0] ?? '';
}

export function describeDns(server: string): string {
  const known: Record<string, string> = {
    '1.1.1.1': 'Cloudflare',
    '1.0.0.1': 'Cloudflare (secondary)',
    '8.8.8.8': 'Google',
    '8.8.4.4': 'Google (secondary)',
    '9.9.9.9': 'Quad9',
    '149.112.112.112': 'Quad9 (secondary)',
    '208.67.222.222': 'OpenDNS',
    '208.67.220.220': 'OpenDNS (secondary)',
  };
  return known[server] ?? '';
}
