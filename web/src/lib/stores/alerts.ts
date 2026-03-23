import { writable } from 'svelte/store';
import type { AlertRule, AlertEvent } from '$lib/types';

export const alertRules = writable<AlertRule[]>([]);
export const alertEvents = writable<AlertEvent[]>([]);

export async function loadAlertRules() {
  const res = await fetch('/api/alerts');
  const data = await res.json();
  alertRules.set(data.rules ?? []);
}

export async function addRule(rule: Omit<AlertRule, 'id' | 'enabled'>) {
  await fetch('/api/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add', rule }),
  });
  await loadAlertRules();
}

export async function toggleRule(id: string, enabled: boolean) {
  await fetch('/api/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'toggle', id, enabled }),
  });
  await loadAlertRules();
}

export async function deleteRule(id: string) {
  await fetch('/api/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', id }),
  });
  await loadAlertRules();
}

export async function loadAlertLog() {
  const res = await fetch('/api/alerts/log');
  alertEvents.set(await res.json());
}
