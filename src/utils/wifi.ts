import { execa } from 'execa';
import { platform } from 'os';

const os = platform();

export interface WifiInfo {
  ssid: string;
  signal: number;
  channel: number;
  security: string;
  bssid: string;
  radioType: string;
}

export interface SavedNetwork {
  name: string;
}

export function signalQuality(dbm: number): string {
  if (dbm >= -50) return 'Excellent';
  if (dbm >= -60) return 'Good';
  if (dbm >= -70) return 'Fair';
  if (dbm >= -80) return 'Weak';
  return 'Very Weak';
}

export function percentToDbm(percent: number): number {
  return Math.round((percent / 2) - 100);
}

async function execSafe(cmd: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execa(cmd, args);
    return stdout.trim();
  } catch {
    return '';
  }
}

// ── macOS ──────────────────────────────────────────────────────────

async function macGetSSID(): Promise<string> {
  const out = await execSafe('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport', ['-I']);
  const match = out.match(/\bSSID:\s*(.+)/);
  return match?.[1]?.trim() ?? '';
}

async function macGetPassword(ssid: string): Promise<string> {
  const out = await execSafe('security', ['find-generic-password', '-wa', ssid, '-D', 'AirPort network password']);
  return out;
}

async function macGetInfo(): Promise<Partial<WifiInfo>> {
  const out = await execSafe('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport', ['-I']);
  const get = (key: string) => out.match(new RegExp(`\\b${key}:\\s*(.+)`))?.[1]?.trim() ?? '';

  return {
    ssid: get('SSID'),
    signal: parseInt(get('agrCtlRSSI')) || 0,
    channel: parseInt(get('channel')) || 0,
    bssid: get('BSSID'),
    security: get('link auth'),
    radioType: get('lastTxRate') ? `${get('lastTxRate')} Mbps` : '',
  };
}

async function macListNetworks(): Promise<SavedNetwork[]> {
  const out = await execSafe('networksetup', ['-listpreferredwirelessnetworks', 'en0']);
  return out
    .split('\n')
    .slice(1)
    .map(l => l.trim())
    .filter(Boolean)
    .map(name => ({ name }));
}

// ── Linux ──────────────────────────────────────────────────────────

async function linuxGetSSID(): Promise<string> {
  const out = await execSafe('nmcli', ['-t', '-f', 'active,ssid', 'dev', 'wifi']);
  const line = out.split('\n').find(l => l.startsWith('yes:'));
  return line?.split(':')?.[1] ?? '';
}

async function linuxGetPassword(ssid: string): Promise<string> {
  const out = await execSafe('nmcli', ['-s', '-g', '802-11-wireless-security.psk', 'connection', 'show', ssid]);
  return out;
}

async function linuxGetInfo(): Promise<Partial<WifiInfo>> {
  const ssid = await linuxGetSSID();
  const iwOut = await execSafe('iwconfig', ['wlan0']);
  const nmOut = await execSafe('nmcli', ['-t', '-f', 'SIGNAL,CHAN,SECURITY,BSSID', 'dev', 'wifi']);

  const signalMatch = iwOut.match(/Signal level[=:](-?\d+)/);
  const chanMatch = iwOut.match(/Channel[=:](\d+)/);
  const activeLine = nmOut.split('\n').find(l => l.includes(ssid));

  return {
    ssid,
    signal: signalMatch ? parseInt(signalMatch[1]) : 0,
    channel: chanMatch ? parseInt(chanMatch[1]) : 0,
    bssid: activeLine?.split(':')?.[3] ?? '',
    security: activeLine?.split(':')?.[2] ?? '',
    radioType: '',
  };
}

async function linuxListNetworks(): Promise<SavedNetwork[]> {
  const out = await execSafe('nmcli', ['-t', '-f', 'NAME', 'connection', 'show']);
  return out
    .split('\n')
    .filter(Boolean)
    .map(name => ({ name }));
}

// ── Windows ────────────────────────────────────────────────────────

async function winGetSSID(): Promise<string> {
  const out = await execSafe('netsh', ['wlan', 'show', 'interfaces']);
  const match = out.match(/^\s*SSID\s*:\s*(.+)$/m);
  return match?.[1]?.trim() ?? '';
}

async function winGetPassword(ssid: string): Promise<string> {
  const out = await execSafe('netsh', ['wlan', 'show', 'profile', `name=${ssid}`, 'key=clear']);
  const match = out.match(/Key Content\s*:\s*(.+)/);
  return match?.[1]?.trim() ?? '';
}

async function winGetInfo(): Promise<Partial<WifiInfo>> {
  const out = await execSafe('netsh', ['wlan', 'show', 'interfaces']);
  const get = (key: string) => {
    const match = out.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, 'm'));
    return match?.[1]?.trim() ?? '';
  };

  const signalPercent = parseInt(get('Signal').replace('%', '')) || 0;

  return {
    ssid: get('SSID'),
    signal: percentToDbm(signalPercent),
    channel: parseInt(get('Channel')) || 0,
    bssid: get('BSSID'),
    security: get('Authentication'),
    radioType: get('Radio type'),
  };
}

async function winListNetworks(): Promise<SavedNetwork[]> {
  const out = await execSafe('netsh', ['wlan', 'show', 'profiles']);
  const matches = [...out.matchAll(/All User Profile\s*:\s*(.+)/g)];
  return matches.map(m => ({ name: m[1].trim() }));
}

// ── Public API ─────────────────────────────────────────────────────

export async function getSSID(): Promise<string> {
  if (os === 'darwin') return macGetSSID();
  if (os === 'linux') return linuxGetSSID();
  return winGetSSID();
}

export async function getPassword(ssid?: string): Promise<string> {
  const name = ssid ?? await getSSID();
  if (!name) throw new Error('Not connected to any Wi-Fi network');

  if (os === 'darwin') return macGetPassword(name);
  if (os === 'linux') return linuxGetPassword(name);
  return winGetPassword(name);
}

export async function getWifiInfo(): Promise<WifiInfo> {
  let info: Partial<WifiInfo>;

  if (os === 'darwin') info = await macGetInfo();
  else if (os === 'linux') info = await linuxGetInfo();
  else info = await winGetInfo();

  return {
    ssid: info.ssid ?? '',
    signal: info.signal ?? 0,
    channel: info.channel ?? 0,
    security: info.security ?? '',
    bssid: info.bssid ?? '',
    radioType: info.radioType ?? '',
  };
}

export async function listSavedNetworks(): Promise<SavedNetwork[]> {
  if (os === 'darwin') return macListNetworks();
  if (os === 'linux') return linuxListNetworks();
  return winListNetworks();
}

export function estimateCongestion(channel: number): string {
  const crowded = [1, 6, 11];
  if (crowded.includes(channel)) {
    return 'High — common channel, likely congested';
  }
  return 'Low — uncommon channel';
}
