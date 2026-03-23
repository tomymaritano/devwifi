# devwifi

A developer-first CLI for diagnosing, inspecting, monitoring, and sharing Wi-Fi and network information.

Fast. Beautiful. Cross-platform.

CLI tools: simple commands, minimal dependencies, beautiful output, fast execution.

## Install

```bash
npm install -g devwifi
```

Or run directly:

```bash
npx devwifi doctor
```

## Commands

### Core

| Command | Description |
|---------|-------------|
| `devwifi pass [network]` | Show the password of the current or any saved Wi-Fi network |
| `devwifi qr` | Generate a scannable QR code to share Wi-Fi credentials |
| `devwifi list` | List all saved Wi-Fi networks on this machine |
| `devwifi signal` | Show signal strength in dBm with visual quality indicator |
| `devwifi speed` | Run a download/upload speed test (via Cloudflare) |
| `devwifi dns` | Show current DNS servers |
| `devwifi dns fix` | Switch DNS to Cloudflare (1.1.1.1 / 1.0.0.1) |
| `devwifi doctor` | Full network diagnostic (signal, speed, DNS, latency, congestion) |

### Monitoring

| Command | Description |
|---------|-------------|
| `devwifi monitor` | Start a persistent web dashboard with real-time monitoring |
| `devwifi ui` | Alias for `devwifi monitor` |
| `devwifi watch` | Live network stats in the terminal with sparkline charts |

## Usage Examples

### Retrieve a Wi-Fi password

```
$ devwifi pass

  Network  HomeOffice
  Password s3cur3P@ss!

$ devwifi pass "CoffeeShop_5G" --copy

  Network  CoffeeShop_5G
  Password guest1234

  Copied to clipboard ✓
```

### Share Wi-Fi via QR code

```
$ devwifi qr

  Network HomeOffice
  Scan this QR code to connect:

  ▄▄▄▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄▄▄▄
  █ ▄▄▄ █ █▀█▄█ █ ▄▄▄ █
  ...
```

Scan with any phone camera to instantly connect to the network.

### Check signal strength

```
$ devwifi signal

  Network    HomeOffice
  Signal     -49 dBm
  Quality    █████ Excellent
  Channel    36
  BSSID      a8:6d:aa:12:34:56
  Radio      802.11ac
```

### Run a speed test

```
$ devwifi speed

  Speed Test Results

  Latency    5 ms
  Download   420.15 Mbps
  Upload     38.72 Mbps

  Powered by Cloudflare Speed Test
```

### Full diagnostic

```
$ devwifi doctor

  devwifi doctor — full network diagnostic
  ────────────────────────────────────────────────

  Connection
  Network        HomeOffice
  Password       Ho********ce
  Security       WPA2-Personal

  Signal
  Strength       -49 dBm (Excellent)
  Channel        36
  Congestion     Low — uncommon channel

  Network
  Local IP       192.168.1.42
  Gateway        192.168.1.1
  Latency        5 ms

  Speed
  Download       420.15 Mbps
  Upload         38.72 Mbps

  DNS
  Server         1.1.1.1 (Cloudflare)

  ✓ No issues detected

  ────────────────────────────────────────────────
```

### Live terminal monitor

```
$ devwifi watch

  devwifi watch — live network monitor
  ──────────────────────────────────────────────────

  Network          HomeOffice
  Signal           -49 dBm (Excellent)
  Channel          36

  Download         12.45 Mbps  peak 156.3 Mbps
                   ▂▃▅▇█▆▅▃▂▁▂▃▅▇▆▅▃▂▁▂▃▅▇█▆▅▃▂▁

  Upload           3.21 Mbps   peak 42.1 Mbps
                   ▁▂▃▂▁▁▂▃▄▅▃▂▁▁▂▃▂▁▁▂▃▄▅▃▂▁▁▂▃▂

  Latency          5 ms
                   ▁▁▁▂▁▁▁▁▂▁▁▁▁▁▂▁▁▁▁▂▁▁▁▁▁▂▁▁▁▁

  Total RX         1.23 GB
  Total TX         245.6 MB

  ──────────────────────────────────────────────────
  Updated 15:43:20 · every 2s · Ctrl+C to stop
```

### Web dashboard

```
$ devwifi monitor

  devwifi monitor — continuous network monitoring

  Dashboard   http://localhost:3142
  API         http://localhost:3142/api/status
  Interval    every 5s
  Storage     ~/.devwifi/history.json

  Press Ctrl+C to stop
```

Opens a full web dashboard with:

- **Dashboard** — Real-time bandwidth and latency charts
- **History** — 1h / 6h / 24h / 7d historical data with export (CSV/JSON)
- **Networks** — View saved networks, reveal passwords, generate QR codes
- **DNS** — View and switch DNS (Cloudflare, Google, Quad9, OpenDNS, or custom)
- **Devices** — Scan and list all devices on your local network
- **Alerts** — Configurable rules with desktop notifications and webhooks

## REST API

When `devwifi monitor` is running, these endpoints are available:

```
GET  /api/status           Current network stats (Prometheus-friendly)
GET  /api/networks         Saved Wi-Fi networks
GET  /api/password/:name   Password for a specific network
GET  /api/dns              Current DNS servers
POST /api/dns              Change DNS servers { primary, secondary }
GET  /api/devices          Scan local network for devices
GET  /api/alerts           Alert configuration
POST /api/alerts           Add/toggle/delete alert rules
GET  /api/alerts/log       Recent alert events
GET  /api/history?range=   Bandwidth/latency history (1h, 6h, 24h, 7d)
SSE  /events               Real-time event stream
```

## How It Works

devwifi uses native system commands to query Wi-Fi and network information:

| Platform | Tools Used |
|----------|-----------|
| **macOS** | `airport`, `security`, `networksetup`, `scutil` |
| **Linux** | `nmcli`, `iwconfig`, `/proc/net/dev` |
| **Windows** | `netsh wlan`, `ipconfig`, `netstat`, `arp` |

All platform-specific logic is abstracted behind a unified API in `src/utils/`. Commands work identically across operating systems.

**Speed tests** use Cloudflare's infrastructure — no API keys or external tools required.

**QR codes** use the standard `WIFI:T:WPA;S:<ssid>;P:<password>;;` format.

**Monitoring data** is persisted to `~/.devwifi/history.json` with 7-day retention.

## Architecture

```
src/
├── commands/           CLI command handlers
│   ├── pass.ts         Password retrieval
│   ├── qr.ts           QR code generation
│   ├── list.ts         Network listing
│   ├── signal.ts       Signal strength display
│   ├── speed.ts        Speed test runner
│   ├── dns.ts          DNS show/fix
│   ├── doctor.ts       Full diagnostic
│   ├── monitor.ts      Web server + SSE + REST API
│   ├── watch.ts        Terminal live stats
│   └── ui.ts           Alias for monitor
├── utils/              Platform-abstracted utilities
│   ├── wifi.ts         Wi-Fi operations (SSID, password, signal, channel)
│   ├── network.ts      Network info (latency, IP, gateway)
│   ├── speedtest.ts    Cloudflare speed test
│   ├── dns.ts          DNS read/write operations
│   ├── monitor.ts      Bandwidth/latency sampling engine
│   ├── scanner.ts      ARP-based device discovery
│   ├── store.ts        Persistent JSON storage
│   └── alerts.ts       Alert rules, notifications, webhooks
├── dashboard.ts        Embedded web dashboard (HTML/CSS/JS)
└── index.ts            CLI entry point (Commander.js)
```

## Docker

Run the monitor as a persistent background service:

```bash
# Build and start
npm run build
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

The dashboard is accessible at `http://localhost:3142`.

> **Note:** Docker runs with `network_mode: host` to monitor host network traffic. Wi-Fi specific commands (signal, password, QR) require native access to the wireless adapter and don't work from inside a container.

## Development

```bash
git clone https://github.com/tomymaritano/devwifi.git
cd devwifi
npm install
npm run dev -- doctor    # run with tsx (no build needed)
npm run build            # compile TypeScript
npm test                 # run tests with Vitest
```

## Publishing

```bash
npm login
npm publish
```

Then install globally from anywhere:

```bash
npm install -g devwifi
```

## Requirements

- Node.js >= 18
- Administrator/root privileges for `devwifi pass`, `devwifi qr`, and `devwifi dns fix`

## License

MIT
