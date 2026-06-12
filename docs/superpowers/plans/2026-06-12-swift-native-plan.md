# Swift Native Desktop Plan

## Objective

Implement a native macOS desktop client for `devwifi` using Swift/SwiftUI that consumes the existing local Node monitor service and preserves the Svelte web dashboard as the online UI.

## Current state

- The CLI and local monitor service already exist in `src/`.
- `devwifi monitor` exposes a local REST API and SSE event stream on `http://localhost:3142`.
- A Svelte web dashboard exists in `web/`.
- The package is not yet published on npm, and installation is currently local-source based.

## Strategy

Use the Node service as the shared backend for both web and native UI.

- Keep the monitoring engine and persistence in Node.
- Build the macOS UI as a lightweight Swift/SwiftUI client.
- Use the local API to query status, history, networks, DNS, and alerts.
- Use SSE or polling for live updates.
- Optionally provide a macOS LaunchAgent to run `devwifi monitor` automatically.

## Goals

1. Native macOS UI for status + dashboard.
2. Use existing Node backend and local API.
3. Keep Svelte online dashboard as a fallback and browser-based option.
4. Add a `LaunchAgent` or helper script for background monitoring.
5. Document the desktop flow in README and plans.

## Execution plan

### Step 1: Validate the local API

- Start the monitor service from the repo:
  - `npm install`
  - `npm run build`
  - `npm run dev -- monitor` or `npm install -g . && devwifi monitor`
- Confirm endpoints:
  - `GET /api/status`
  - `GET /api/history?range=1h|6h|24h|7d`
  - `GET /api/networks`
  - `GET /api/dns`
  - `POST /api/dns`
  - `GET /api/alerts`
  - `POST /api/alerts`
  - `SSE /events`
- Confirm the Node service returns usable JSON and event updates.

### Step 2: Create SwiftUI macOS app skeleton

- Create a new Xcode macOS SwiftUI app target.
- Define a local API client in Swift:
  - `StatusClient`
  - `HistoryClient`
  - `NetworkClient`
  - `DnsClient`
  - `AlertsClient`
  - `EventsClient` using `URLSession` and `EventSource` / `AsyncSequence`
- Create a minimal UI:
  - status cards (network, bandwidth, latency)
  - charts for history
  - network list and password QR actions
  - DNS status/quick fix UI
  - alerts summary

### Step 3: Build native UI features

- Show current connection and signal quality.
- Display bandwidth/latency charts using SwiftUI.
- Show history ranges (1h, 6h, 24h, 7d).
- Integrate alerts with native notifications when needed.
- Provide a button to open the web dashboard in the default browser.
- Optionally provide a status bar item with quick state.

### Step 4: Background service support

- Add a macOS LaunchAgent plist template to run `devwifi monitor` at login.
- Document how to install it locally.
- The LaunchAgent should execute `devwifi monitor --port 3142` or a dedicated launch command.
- Keep the native UI independent of the service startup, with a connection status indicator.

### Step 5: Test and verify

- Run the native Swift app while the Node service is active.
- Confirm data refresh and event updates.
- Verify `open http://localhost:3142` still works.
- Confirm `devwifi pass`, `devwifi qr`, and `devwifi dns` continue functioning.
- Verify on macOS with `networksetup`/`security` paths.

### Step 6: Document the workflow

- Add a README section describing the Swift desktop client.
- Describe how the native app uses the Node API.
- Add a `docs/superpowers/plans/2026-06-12-swift-native-plan.md` record of the plan.
- Include background service/LaunchAgent instructions.

## Deliverables

- `docs/superpowers/plans/2026-06-12-swift-native-plan.md`
- A SwiftUI macOS app project or starter template
- API client code for the local Node monitor service
- Optional LaunchAgent `.plist` template
- README section describing the native macOS flow

## Notes

- This is a native UI implementation, not a replacement for the Node backend.
- The Node monitor service remains the source of truth for real-time data and history.
- The Swift app is a client that can consume the local API and present a native desktop experience.
