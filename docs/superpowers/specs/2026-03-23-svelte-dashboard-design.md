# devwifi v2 — Svelte Dashboard Rebuild

**Date:** 2026-03-23
**Status:** Approved

## Summary

Rebuild the devwifi web dashboard from an embedded HTML template string (630 lines) to a proper Svelte 5 application with shadcn-svelte components, Tailwind CSS, and real-time data via SSE stores.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Svelte 5 + Vite | Compiles to vanilla JS, tiny runtime (~5KB), native reactivity ideal for SSE real-time data |
| CSS | Tailwind CSS | Utility-first, purged at build, maps cleanly to existing dark theme tokens |
| Components | shadcn-svelte | Copy-to-project model (no dependency lock-in), dark theme built-in, all needed primitives |
| Charts | Layerchart (shadcn-svelte native) | Integrates with shadcn theme, Svelte-native, no Chart.js CDN dependency |
| Navigation | Fixed sidebar | Professional, scalable, grouped sections. Already validated in current dashboard |
| Visual style | Vercel/Linear | Clean, spacious, large typography, subtle borders, elegant dark theme |
| Architecture | Frontend embedded in same project (`web/` directory) | Single repo, single `npm publish`, shared build script |
| Not chosen | Next.js | SSR/API routes/React runtime unnecessary — we already have a Node.js API server |
| Not chosen | SvelteKit | File-based routing/SSR overkill for an embedded SPA |

## Project Structure

```
devwifi/
├── src/                          ← CLI backend (unchanged)
│   ├── commands/
│   │   ├── monitor.ts            ← Serves web/dist/ instead of embedded HTML
│   │   └── ...
│   ├── utils/
│   └── index.ts
├── web/                          ← NEW: Svelte frontend
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/
│   │   │   │   ├── ui/           ← shadcn-svelte primitives
│   │   │   │   ├── charts/       ← BandwidthChart, LatencyChart, SignalGauge
│   │   │   │   ├── layout/       ← Sidebar, TopBar
│   │   │   │   └── pages/        ← Dashboard, History, Networks, DNS, Devices, Alerts
│   │   │   ├── stores/
│   │   │   │   ├── sse.ts        ← EventSource + auto-reconnect with backoff
│   │   │   │   ├── network.ts    ← Bandwidth, latency, totals (derived stores)
│   │   │   │   └── alerts.ts     ← Alert rules + log store
│   │   │   └── utils/
│   │   │       ├── format.ts     ← formatBytes, formatSpeed, formatLatency
│   │   │       └── colors.ts     ← Signal quality colors, threshold helpers
│   │   ├── app.css               ← Tailwind directives + CSS custom properties
│   │   ├── App.svelte            ← Root: sidebar + page router
│   │   └── main.ts               ← Mount point
│   ├── static/                   ← Favicon, manifest
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── svelte.config.js
├── package.json                  ← Updated build scripts
├── Dockerfile                    ← Updated to include web/dist/
└── tsconfig.json
```

## Pages Specification

### Dashboard (default)

**Purpose:** Real-time overview of all network metrics.

**Components:**
- `StatCards` — 6 cards in a responsive grid: Download (Mbps), Upload (Mbps), Latency (ms), Total Downloaded, Total Uploaded, Peak Download
- `BandwidthChart` — Area chart, two datasets (download blue, upload purple), 1h rolling window, tooltips on hover
- `LatencyChart` — Area chart, single dataset (green), color shifts yellow/red on spikes
- `NetworkInfoCard` — Table: Local IP, Gateway, DNS servers, SSID, Signal, Channel
- `RecentAlerts` — Last 5 alerts with timestamp and severity badge

**Data source:** SSE `tick` and `info` events → Svelte stores → reactive binding.

### History

**Purpose:** Historical data analysis and export.

**Components:**
- `TimeRangeSelector` — shadcn Select: 1h, 6h, 24h, 7d
- `HistoryBandwidthChart` — Full-width area chart for selected range
- `HistoryLatencyChart` — Full-width area chart for selected range
- `SummaryStats` — Cards: Avg Download, Avg Latency, Total Transfer
- `ExportButtons` — CSV and JSON download buttons

**Data source:** REST `GET /api/history?range=` on range change.

### Networks

**Purpose:** View saved Wi-Fi networks, retrieve passwords, generate QR codes.

**Components:**
- `NetworksTable` — shadcn Table: #, Name, Password (masked/revealed), Actions
- `PasswordCell` — Toggle show/hide, click to copy to clipboard
- `QrDialog` — shadcn Dialog with client-side QR code generation (no external API)
- `SearchFilter` — Filter networks by name

**Data source:** REST `GET /api/networks`, `GET /api/password/:name`.

**QR generation:** Use `qrcode` npm package client-side. Format: `WIFI:T:WPA;S:<ssid>;P:<password>;;`

### DNS

**Purpose:** View and change DNS configuration.

**Components:**
- `CurrentDNS` — Display current servers with provider badges
- `PresetCards` — 4 clickable cards: Cloudflare, Google, Quad9, OpenDNS
- `CustomDNSForm` — Two inputs (primary/secondary) + Apply button
- `ConfirmDialog` — Confirmation before changing DNS (requires admin)

**Data source:** REST `GET /api/dns`, `POST /api/dns`.

### Devices

**Purpose:** Discover and list devices on the local network.

**Components:**
- `ScanButton` — Triggers ARP scan with loading state
- `DevicesTable` — shadcn Table: IP, MAC, Hostname, Vendor (with badges)
- `DeviceCount` — Badge showing total discovered devices

**Data source:** REST `GET /api/devices`.

### Alerts

**Purpose:** Configure alert rules and view alert history.

**Components:**
- `RuleForm` — Metric select, condition select, threshold input, webhook URL input
- `RulesTable` — shadcn Table with toggle switches (enable/disable) and delete buttons
- `AlertTimeline` — Chronological list of fired alerts with severity and timestamp

**Data source:** REST `GET /api/alerts`, `POST /api/alerts`, `GET /api/alerts/log`. SSE `alert` events for real-time log updates.

## Data Flow

```
Server (Node.js)
  │
  ├── SSE /events ────→ sse.ts store (EventSource + reconnect)
  │                        │
  │                        ├──→ network.ts store (bandwidth, latency, totals)
  │                        │      │
  │                        │      └──→ Dashboard components (reactive)
  │                        │      └──→ Chart components (auto-update)
  │                        │
  │                        └──→ alerts.ts store (alert log)
  │                               └──→ Alerts page, Dashboard recent alerts
  │
  └── REST /api/* ←──→ fetch() from page components (on-demand)
                        Networks, DNS, Devices, History, Alert config
```

### SSE Reconnection Strategy

```typescript
// sse.ts store
let retryDelay = 1000;
const MAX_DELAY = 30000;

function connect() {
  const source = new EventSource('/events');
  source.onopen = () => { retryDelay = 1000; };
  source.onerror = () => {
    source.close();
    setTimeout(connect, retryDelay);
    retryDelay = Math.min(retryDelay * 2, MAX_DELAY);
  };
  // ... event handlers update stores
}
```

## Build Integration

### package.json (root) scripts

```json
{
  "build": "npm run build:web && tsc",
  "build:web": "cd web && npm install && npm run build",
  "dev": "tsx src/index.ts",
  "dev:web": "cd web && npm run dev"
}
```

### Vite config (web/vite.config.ts)

```typescript
export default defineConfig({
  build: { outDir: 'dist' },
  server: {
    proxy: { '/api': 'http://localhost:3142', '/events': 'http://localhost:3142' }
  }
});
```

- Production: CLI serves `web/dist/` as static files
- Development: `vite dev` proxies API calls to the running CLI server

### CLI serving (monitor.ts change)

Replace embedded HTML generation with static file serving:

```typescript
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createReadStream, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_DIR = join(__dirname, '..', '..', 'web', 'dist');

// In request handler, for non-API/non-SSE requests:
// Serve static files from WEB_DIR with proper MIME types
// Fallback to index.html for client-side routing
```

### npm publish

```json
{
  "files": ["dist", "web/dist"]
}
```

Both compiled CLI and built frontend are included in the package.

## Backend Changes

### Remove
- `src/dashboard.ts` — replaced entirely by Svelte app

### Modify
- `src/commands/monitor.ts` — serve static files from `web/dist/` instead of calling `getDashboardHTML()`
- `src/commands/ui.ts` — no changes needed (delegates to monitor)

### Add
- Input validation with Zod on POST endpoints (`/api/dns`, `/api/alerts`)
- Optional basic auth flag: `devwifi monitor --auth user:pass`
- MIME type handling for static file serving (html, js, css, svg, json)

## Roadmap

### Phase 1 — Frontend Rebuild (current)
- Scaffold Svelte + Vite + Tailwind + shadcn-svelte in `web/`
- Implement all 6 pages with shadcn components
- SSE stores with auto-reconnect
- Client-side QR code generation
- Integrate build pipeline
- Remove embedded dashboard.ts
- Tests for stores and utilities

### Phase 2 — Enhanced Monitoring
- Packet loss tracking (new metric in monitor sampling)
- Uptime tracking with connection drop detection
- Signal strength history chart
- `devwifi trace <host>` — visual traceroute command

### Phase 3 — Integrations
- Prometheus `/metrics` endpoint for Grafana
- Telegram and Discord webhook formatters for alerts
- Basic auth middleware for dashboard security

### Phase 4 — Power Features
- `devwifi benchmark` — compare real speed vs ISP advertised speed
- Plugin system for custom commands
- Bandwidth quotas and monthly usage limits
- PWA manifest + service worker for offline dashboard access

## Security Considerations

- Passwords served only via authenticated API (when auth enabled)
- No XSS: Svelte auto-escapes template expressions
- No external API dependency for QR codes (client-side generation)
- DNS changes require confirmation dialog
- Input validation on all POST endpoints
