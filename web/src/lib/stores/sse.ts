import { writable } from 'svelte/store';
import type { TickEvent, InfoEvent, AlertEvent } from '$lib/types';

export const connected = writable(false);
export const lastTick = writable<TickEvent | null>(null);
export const info = writable<InfoEvent | null>(null);
export const alertLog = writable<AlertEvent[]>([]);

let retryDelay = 1000;
const MAX_DELAY = 30000;

export function connectSSE() {
  const source = new EventSource('/events');

  source.onopen = () => {
    connected.set(true);
    retryDelay = 1000;
  };

  source.addEventListener('tick', (e) => {
    lastTick.set(JSON.parse(e.data));
  });

  source.addEventListener('info', (e) => {
    info.set(JSON.parse(e.data));
  });

  source.addEventListener('alert', (e) => {
    const data = JSON.parse(e.data);
    alertLog.set(data.log ?? []);
  });

  source.onerror = () => {
    connected.set(false);
    source.close();
    setTimeout(connectSSE, retryDelay);
    retryDelay = Math.min(retryDelay * 2, MAX_DELAY);
  };
}
