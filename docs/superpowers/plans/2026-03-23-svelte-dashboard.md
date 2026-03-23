# Svelte Dashboard Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 630-line embedded HTML dashboard with a proper Svelte 5 + Tailwind + shadcn-svelte application.

**Architecture:** Svelte SPA lives in `web/`, builds to static files via Vite, served by the existing Node.js HTTP server in `monitor.ts`. SSE data flows through Svelte writable stores into reactive components.

**Tech Stack:** Svelte 5, Vite 6, Tailwind CSS 4, shadcn-svelte, Layerchart, qrcode (client-side)

**Spec:** `docs/superpowers/specs/2026-03-23-svelte-dashboard-design.md`

---

### Task 1: Scaffold Svelte + Vite project

**Files:**
- Create: `web/package.json`
- Create: `web/vite.config.ts`
- Create: `web/svelte.config.js`
- Create: `web/tsconfig.json`
- Create: `web/src/main.ts`
- Create: `web/src/app.css`
- Create: `web/src/App.svelte`
- Create: `web/index.html`

- [ ] **Step 1: Create the web directory and initialize Svelte project**

```bash
cd ~/devwifi
npm create vite@latest web -- --template svelte-ts
```

- [ ] **Step 2: Install dependencies**

```bash
cd ~/devwifi/web
npm install
```

- [ ] **Step 3: Verify dev server starts**

```bash
cd ~/devwifi/web && npm run dev -- --port 5173
```

Expected: Vite dev server running on http://localhost:5173

- [ ] **Step 4: Commit**

```bash
git add web/
git commit -m "feat(web): scaffold Svelte 5 + Vite project"
```

---

### Task 2: Add Tailwind CSS

**Files:**
- Modify: `web/package.json` (add tailwind deps)
- Create: `web/tailwind.config.ts`
- Modify: `web/src/app.css` (tailwind directives + dark theme tokens)

- [ ] **Step 1: Install Tailwind and dependencies**

```bash
cd ~/devwifi/web
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Add Tailwind plugin to vite.config.ts**

```typescript
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
});
```

- [ ] **Step 3: Replace app.css with Tailwind directives and dark theme**

```css
@import "tailwindcss";

:root {
  --bg: #09090b;
  --surface: #111113;
  --surface2: #18181b;
  --border: #27272a;
  --text: #fafafa;
  --dim: #71717a;
  --accent: #3b82f6;
  --green: #22c55e;
  --yellow: #eab308;
  --red: #ef4444;
  --purple: #a855f7;
}

body {
  @apply bg-[var(--bg)] text-[var(--text)] min-h-screen;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif;
}
```

- [ ] **Step 4: Verify Tailwind is working**

Add a `<h1 class="text-3xl font-bold text-blue-500">devwifi</h1>` to App.svelte, check it renders styled.

- [ ] **Step 5: Commit**

```bash
git add web/
git commit -m "feat(web): add Tailwind CSS with dark theme tokens"
```

---

### Task 3: Add shadcn-svelte

**Files:**
- Modify: `web/package.json`
- Create: `web/src/lib/components/ui/` (shadcn primitives)
- Create: `web/components.json`

- [ ] **Step 1: Initialize shadcn-svelte**

```bash
cd ~/devwifi/web
npx shadcn-svelte@latest init
```

Select: TypeScript, default style, dark theme.

- [ ] **Step 2: Add required components**

```bash
npx shadcn-svelte@latest add card table badge button dialog select input separator switch tabs
```

- [ ] **Step 3: Verify a shadcn component renders**

Import `Card` into App.svelte, render it, check dark theme.

- [ ] **Step 4: Commit**

```bash
git add web/
git commit -m "feat(web): add shadcn-svelte with core UI components"
```

---

### Task 4: Utility functions and types

**Files:**
- Create: `web/src/lib/utils/format.ts`
- Create: `web/src/lib/utils/colors.ts`
- Create: `web/src/lib/types.ts`

- [ ] **Step 1: Create shared types**

`web/src/lib/types.ts`:
```typescript
export interface BandwidthPoint {
  timestamp: number;
  downloadMbps: number;
  uploadMbps: number;
}

export interface LatencyPoint {
  timestamp: number;
  ms: number;
}

export interface TickEvent {
  bw: BandwidthPoint;
  lat: LatencyPoint;
  totalRx: string;
  totalTx: string;
}

export interface InfoEvent {
  localIP: string;
  gateway: string;
  dns: { address: string; provider: string }[];
  startedAt: number;
}

export interface AlertEvent {
  rule: { id: string; metric: string; condition: string; threshold: number };
  value: number;
  message: string;
  timestamp: number;
}

export interface NetworkDevice {
  ip: string;
  mac: string;
  hostname: string;
  type: string;
}

export interface SavedNetwork {
  name: string;
}

export interface AlertRule {
  id: string;
  enabled: boolean;
  metric: string;
  condition: string;
  threshold: number;
  webhookUrl?: string;
}
```

- [ ] **Step 2: Create format utilities**

`web/src/lib/utils/format.ts`:
```typescript
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function formatUptime(startedAt: number): string {
  const diff = Math.floor((Date.now() - startedAt) / 1000);
  const h = String(Math.floor(diff / 3600)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
  const s = String(diff % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
```

- [ ] **Step 3: Create color utilities**

`web/src/lib/utils/colors.ts`:
```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/
git commit -m "feat(web): add types, format, and color utilities"
```

---

### Task 5: SSE and network stores

**Files:**
- Create: `web/src/lib/stores/sse.ts`
- Create: `web/src/lib/stores/network.ts`
- Create: `web/src/lib/stores/alerts.ts`

- [ ] **Step 1: Create SSE store with auto-reconnect**

`web/src/lib/stores/sse.ts`:
```typescript
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
```

- [ ] **Step 2: Create network store (derived from SSE ticks)**

`web/src/lib/stores/network.ts`:
```typescript
import { writable, derived } from 'svelte/store';
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
```

- [ ] **Step 3: Create alerts store**

`web/src/lib/stores/alerts.ts`:
```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/stores/
git commit -m "feat(web): add SSE, network, and alerts stores"
```

---

### Task 6: Layout — Sidebar and App shell

**Files:**
- Create: `web/src/lib/components/layout/Sidebar.svelte`
- Modify: `web/src/App.svelte`

- [ ] **Step 1: Create Sidebar component**

`web/src/lib/components/layout/Sidebar.svelte` — Vercel-style sidebar with brand, grouped nav items (Monitor: Dashboard/History, Manage: Networks/DNS/Devices, Settings: Alerts), uptime footer. Emits `navigate` event with page name.

- [ ] **Step 2: Create App.svelte with sidebar + page router**

`web/src/App.svelte` — Imports Sidebar, tracks `currentPage` state, conditionally renders pages. Calls `connectSSE()` in `onMount`. Layout: sidebar (w-56) + main content area.

- [ ] **Step 3: Verify sidebar renders with placeholder pages**

Run `npm run dev`, check sidebar navigates between placeholder `<div>` pages.

- [ ] **Step 4: Commit**

```bash
git add web/src/
git commit -m "feat(web): add sidebar layout and page routing"
```

---

### Task 7: Dashboard page

**Files:**
- Create: `web/src/lib/components/pages/DashboardPage.svelte`
- Create: `web/src/lib/components/charts/BandwidthChart.svelte`
- Create: `web/src/lib/components/charts/LatencyChart.svelte`

- [ ] **Step 1: Install chart dependency**

```bash
cd ~/devwifi/web && npm install layerchart d3-scale d3-shape d3-array
```

- [ ] **Step 2: Create BandwidthChart component**

Area chart subscribing to `bandwidthHistory` store. Two datasets: download (blue) and upload (purple). Uses Layerchart `Chart`, `Area`, `Axis` components.

- [ ] **Step 3: Create LatencyChart component**

Area chart subscribing to `latencyHistory` store. Single dataset (green). Filters out ms < 0 (timeouts).

- [ ] **Step 4: Create DashboardPage**

6 stat cards (shadcn `Card`) in responsive grid: DL, UL, Latency, Total RX, Total TX, Peak DL. Below: BandwidthChart + LatencyChart in 2-col grid. Below: NetworkInfo card + RecentAlerts card.

- [ ] **Step 5: Wire into App.svelte and verify with live data**

Start CLI backend: `node dist/index.js monitor`
Start frontend: `cd web && npm run dev`
Verify real-time data flows from SSE into charts and stat cards.

- [ ] **Step 6: Commit**

```bash
git add web/src/
git commit -m "feat(web): add Dashboard page with live charts and stats"
```

---

### Task 8: History page

**Files:**
- Create: `web/src/lib/components/pages/HistoryPage.svelte`

- [ ] **Step 1: Create HistoryPage**

TimeRangeSelector (shadcn `Select`: 1h/6h/24h/7d). On change, fetch `/api/history?range=`. Render full-width BandwidthChart + LatencyChart with fetched data. Summary stats: avg download, avg latency, total transfer. Export buttons: CSV and JSON using Blob download.

- [ ] **Step 2: Verify with backend running**

Select different ranges, check charts update. Export CSV, verify contents.

- [ ] **Step 3: Commit**

```bash
git add web/src/
git commit -m "feat(web): add History page with range selector and export"
```

---

### Task 9: Networks page

**Files:**
- Create: `web/src/lib/components/pages/NetworksPage.svelte`

- [ ] **Step 1: Install qrcode for client-side QR generation**

```bash
cd ~/devwifi/web && npm install qrcode @types/qrcode
```

- [ ] **Step 2: Create NetworksPage**

Fetches `/api/networks` on mount. Renders shadcn `Table` with columns: #, Name, Password (masked), Actions. Password cell toggles between `••••••••` and actual value (fetched from `/api/password/:name`). Copy button writes to `navigator.clipboard`. QR button opens shadcn `Dialog` with client-side generated QR code (format: `WIFI:T:WPA;S:<ssid>;P:<password>;;`). Search filter input at top.

- [ ] **Step 3: Verify password reveal, copy, and QR code**

Start backend, open Networks page, test show/copy/QR for a saved network.

- [ ] **Step 4: Commit**

```bash
git add web/src/
git commit -m "feat(web): add Networks page with passwords and QR codes"
```

---

### Task 10: DNS page

**Files:**
- Create: `web/src/lib/components/pages/DnsPage.svelte`

- [ ] **Step 1: Create DnsPage**

Fetches `/api/dns` on mount for current servers. Shows current DNS with provider badges. 4 preset cards (Cloudflare, Google, Quad9, OpenDNS) — click opens confirm dialog, then POSTs to `/api/dns`. Custom DNS form: two inputs + Apply button. Toast feedback on success/failure.

- [ ] **Step 2: Verify DNS display and preset switching**

- [ ] **Step 3: Commit**

```bash
git add web/src/
git commit -m "feat(web): add DNS page with presets and custom config"
```

---

### Task 11: Devices page

**Files:**
- Create: `web/src/lib/components/pages/DevicesPage.svelte`

- [ ] **Step 1: Create DevicesPage**

Scan button triggers `GET /api/devices` with loading state. Results in shadcn `Table`: IP, MAC, Hostname, Vendor (with `Badge`). Device count badge at top.

- [ ] **Step 2: Verify scan and table**

- [ ] **Step 3: Commit**

```bash
git add web/src/
git commit -m "feat(web): add Devices page with network scanner"
```

---

### Task 12: Alerts page

**Files:**
- Create: `web/src/lib/components/pages/AlertsPage.svelte`

- [ ] **Step 1: Create AlertsPage**

RuleForm: metric select, condition select, threshold input, optional webhook URL, Add button. Uses `addRule()` from alerts store. RulesTable: shadcn `Table` with `Switch` toggles and delete buttons. AlertTimeline: chronological list of `alertEvents` with timestamp and message.

- [ ] **Step 2: Verify CRUD on alert rules and log display**

- [ ] **Step 3: Commit**

```bash
git add web/src/
git commit -m "feat(web): add Alerts page with rules and timeline"
```

---

### Task 13: Integrate build pipeline

**Files:**
- Modify: `devwifi/package.json` (add build:web script, update files array)
- Modify: `web/vite.config.ts` (add proxy for dev, set outDir)

- [ ] **Step 1: Configure Vite proxy for development**

`web/vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    proxy: {
      '/api': 'http://localhost:3142',
      '/events': { target: 'http://localhost:3142', headers: { Connection: 'keep-alive' } },
    },
  },
});
```

- [ ] **Step 2: Update root package.json scripts**

Add to scripts:
```json
{
  "build": "npm run build:web && tsc",
  "build:web": "cd web && npm install && npm run build",
  "dev:web": "cd web && npm run dev"
}
```

Update files array: `["dist", "web/dist"]`

- [ ] **Step 3: Build and verify output**

```bash
cd ~/devwifi && npm run build:web
ls web/dist/
```

Expected: `index.html`, `assets/` with JS/CSS bundles.

- [ ] **Step 4: Commit**

```bash
git add package.json web/vite.config.ts
git commit -m "feat: integrate Svelte build pipeline with root project"
```

---

### Task 14: Update monitor.ts to serve static files

**Files:**
- Modify: `src/commands/monitor.ts` (replace getDashboardHTML with static file serving)
- Delete: `src/dashboard.ts`

- [ ] **Step 1: Add static file serving to monitor.ts**

Replace the final `getDashboardHTML()` fallback with code that:
1. Resolves `web/dist/` directory relative to the compiled JS file
2. Maps request URL to file path
3. Serves files with correct MIME types (html, js, css, svg, json, png, ico)
4. Falls back to `index.html` for any unmatched path (SPA routing)

- [ ] **Step 2: Remove dashboard.ts import and file**

Delete `src/dashboard.ts`. Remove the import from `src/commands/monitor.ts`.

- [ ] **Step 3: Full build and test**

```bash
cd ~/devwifi
npm run build
node dist/index.js monitor
```

Open http://localhost:3142 — should show the Svelte dashboard with live data.

- [ ] **Step 4: Commit**

```bash
git add src/ web/
git rm src/dashboard.ts
git commit -m "feat: serve Svelte dashboard from monitor, remove embedded HTML"
```

---

### Task 15: Update Dockerfile

**Files:**
- Modify: `Dockerfile`

- [ ] **Step 1: Update Dockerfile to build web and include web/dist**

```dockerfile
FROM node:22-slim AS web-builder
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    iputils-ping net-tools iproute2 curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist/ ./dist/
COPY --from=web-builder /app/web/dist ./web/dist/
EXPOSE 3142
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3142/ || exit 1
ENTRYPOINT ["node", "dist/index.js"]
CMD ["monitor", "--port", "3142", "--interval", "5"]
```

- [ ] **Step 2: Commit**

```bash
git add Dockerfile
git commit -m "feat: multi-stage Docker build with Svelte frontend"
```

---

### Task 16: Final integration test and push

- [ ] **Step 1: Clean build from scratch**

```bash
cd ~/devwifi
rm -rf dist web/dist
npm run build
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All existing tests pass.

- [ ] **Step 3: Integration test — full monitor**

```bash
node dist/index.js monitor
```

Open http://localhost:3142. Verify:
- Dashboard shows live bandwidth/latency data
- History page loads with time range selector
- Networks page lists saved networks, passwords work
- DNS page shows current servers
- Devices page scans network
- Alerts page CRUD works

- [ ] **Step 4: Push to GitHub**

```bash
git push origin main
```
