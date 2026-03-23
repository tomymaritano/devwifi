import { writable } from 'svelte/store';
import { lastTick } from './sse';
import type { BandwidthPoint, LatencyPoint } from '$lib/types';

const MAX_POINTS = 720;

export const bandwidthHistory = writable<BandwidthPoint[]>([]);
export const latencyHistory = writable<LatencyPoint[]>([]);
export const peakDownload = writable(0);
export const totalRx = writable('0 B');
export const totalTx = writable('0 B');

lastTick.subscribe((tick) => {
  if (!tick) return;

  bandwidthHistory.update((h) => {
    const next = [...h, tick.bw];
    return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
  });

  latencyHistory.update((h) => {
    const next = [...h, tick.lat];
    return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
  });

  peakDownload.update((p) => Math.max(p, tick.bw.downloadMbps));
  totalRx.set(tick.totalRx);
  totalTx.set(tick.totalTx);
});
