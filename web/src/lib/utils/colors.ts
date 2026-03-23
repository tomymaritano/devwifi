export function latencyColor(ms: number): string {
  if (ms < 0) return 'text-red-500';
  if (ms <= 20) return 'text-green-500';
  if (ms <= 50) return 'text-yellow-500';
  return 'text-red-500';
}

export function speedColor(mbps: number): string {
  if (mbps >= 100) return 'text-green-500';
  if (mbps >= 30) return 'text-yellow-500';
  return 'text-red-500';
}

export function signalQuality(dbm: number): { label: string; color: string } {
  if (dbm >= -50) return { label: 'Excellent', color: 'text-green-500' };
  if (dbm >= -60) return { label: 'Good', color: 'text-green-500' };
  if (dbm >= -70) return { label: 'Fair', color: 'text-yellow-500' };
  if (dbm >= -80) return { label: 'Weak', color: 'text-red-500' };
  return { label: 'Very Weak', color: 'text-red-500' };
}
