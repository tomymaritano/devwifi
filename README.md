# devwifi

Developer CLI for diagnosing, inspecting, monitoring, and sharing Wi-Fi and network information.

Fast. Minimal. Cross-platform.

## What is devwifi?

`devwifi` is a local developer tool that combines:

- Wi-Fi password retrieval and QR sharing
- signal quality and channel inspection
- DNS inspection and quick fixes
- Cloudflare-based speed testing
- a full diagnostic command
- live terminal monitoring
- a local browser dashboard with history and alerts

## Installation

### Local install from source

This repository is not published on npm yet. Install locally with:

```bash
git clone https://github.com/tomymaritano/devwifi.git
cd devwifi
npm install
npm run build
npm install -g .
```

Then run:

```bash
devwifi doctor
```

### Run without global install

```bash
npm install
npx . doctor
```

> `npm install -g devwifi` currently fails because the package is not published on npm yet.

## Commands

### Core commands

| Command | Description |
|---------|-------------|
| `devwifi pass [network]` | Show the password of the current or a saved Wi-Fi network |
| `devwifi qr` | Generate a Wi-Fi QR code |
| `devwifi list` | List saved Wi-Fi networks |
| `devwifi signal` | Show current Wi-Fi signal strength and quality |
| `devwifi speed` | Run a speed test via Cloudflare |
| `devwifi dns` | Show current DNS servers |
| `devwifi dns fix` | Set DNS to Cloudflare (1.1.1.1 / 1.0.0.1) |
| `devwifi doctor` | Run a full network diagnostic |

### Monitoring commands

| Command | Description |
|---------|-------------|
| `devwifi monitor` | Start a local web dashboard with real-time monitoring |
| `devwifi ui` | Alias for `devwifi monitor` |
| `devwifi watch` | Live terminal network monitor |

## Usage examples

### Show saved Wi-Fi password

```bash
devwifi pass
```

### Copy password to clipboard

```bash
devwifi pass "MyNetwork" --copy
```

### Generate a QR code

```bash
devwifi qr
```

### Run a speed test

```bash
devwifi speed
```

### Run a diagnostic

```bash
devwifi doctor
```

### Start the dashboard

```bash
devwifi monitor
```

The dashboard is available at `http://localhost:3142` by default.

## Local dashboard API

When `devwifi monitor` is running, the local web server exposes:

- `GET /api/status` — current network and system stats
- `GET /api/networks` — saved Wi-Fi networks
- `GET /api/password/:name` — network password lookup
- `GET /api/dns` — current DNS configuration
- `POST /api/dns` — update DNS servers
- `GET /api/devices` — scan local network devices
- `GET /api/alerts` — alert configuration
- `POST /api/alerts` — add/toggle/delete alert rules
- `GET /api/alerts/log` — recent alert events
- `GET /api/history?range=1h|6h|24h|7d` — bandwidth and latency history
- `SSE /events` — real-time event feed

## How it works

`devwifi` uses native system utilities on each platform and abstracts them behind cross-platform helpers in `src/utils/`.

| Platform | Native tools |
|----------|--------------|
| macOS | `airport`, `security`, `networksetup`, `scutil` |
| Linux | `nmcli`, `iwconfig`, `/proc/net/dev` |
| Windows | `netsh wlan`, `ipconfig`, `netstat`, `arp` |

### Important behavior

- `pass` reads stored Wi-Fi credentials from the OS
- `qr` generates standard `WIFI:T:WPA;S:<ssid>;P:<password>;;` payloads
- `signal` reports current RSSI and channel quality
- `speed` runs a Cloudflare speed test without extra keys
- `monitor` stores historical data in `~/.devwifi/history.json`

## Desktop version vision

devwifi is built to support both web-based and native desktop experience.

- The existing `devwifi monitor` service exposes a local REST + SSE API on `http://localhost:3142`.
- The web dashboard in `web/` is the browser-based UI.
- A native macOS desktop client can be built in Swift/SwiftUI to consume the same local API and event stream.
- Background monitoring and persistence are handled by the Node service, making the desktop client a lightweight UI layer.
- Desktop version goals:
  - use the local monitoring engine for live status and history
  - display real-time charts and alerts in a native window
  - keep Svelte dashboard as the web UI option
  - optionally support a macOS LaunchAgent/daemon for always-on monitoring

This design keeps the CLI, web dashboard, and future desktop client aligned on a single local data source.

## Project structure

```text
src/
├── commands/           CLI command handlers
│   ├── pass.ts
│   ├── qr.ts
│   ├── list.ts
│   ├── signal.ts
│   ├── speed.ts
│   ├── dns.ts
│   ├── doctor.ts
│   ├── monitor.ts
│   ├── ui.ts
│   └── watch.ts
├── utils/              platform helpers
│   ├── wifi.ts
│   ├── network.ts
│   ├── speedtest.ts
│   ├── dns.ts
│   ├── monitor.ts
│   ├── scanner.ts
│   ├── store.ts
│   └── alerts.ts
└── index.ts            CLI entry point
```

The dashboard source is in `web/`, and the production UI is built during `npm run build`.

## Development

```bash
git clone https://github.com/tomymaritano/devwifi.git
cd devwifi
npm install
npm run dev -- doctor
```

Build for production:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Publish plan

The package is not yet published on npm, so the global install command does not work yet.

Publish later with:

```bash
npm login
npm publish
```

Once published, use:

```bash
npm install -g devwifi
```

## Notes

- Use `npm install -g .` or `npx .` while the package remains unpublished.
- `npm audit` may report dev dependency warnings; runtime CLI behavior is independent of `vitest` and `vite`.

## Requirements

- Node.js >= 18
- Administrator/root privileges for `devwifi pass`, `devwifi qr`, and `devwifi dns fix`

## License

MIT
