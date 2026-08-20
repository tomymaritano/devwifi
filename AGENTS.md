# AGENTS.md

## Cursor Cloud specific instructions

`devwifi` is a TypeScript CLI (root) plus a Svelte 5 + Vite + Tailwind web dashboard (`web/`).
The CLI's `monitor` command runs an HTTP server (default port `3142`) that exposes a REST
API + SSE stream and serves the built dashboard from `web/dist`. The Vite dev server
(`web/`, default port `5173`) proxies `/api` and `/events` to the backend on `3142`.

Dependencies for both packages are installed by the startup update script (`npm install` at
the root and in `web/`). Standard commands live in `package.json` (root and `web/`) and the
README — reference those rather than duplicating them.

### Running the two services in dev

- Backend (API/SSE + serves built dashboard): `npm run dev -- monitor --interval 2` (tsx, no build). Runs on `http://localhost:3142`.
- Web frontend (HMR): from `web/`, `npm run dev`. Runs on `http://localhost:5173` and proxies API/SSE to `3142`.
- You need the backend on `3142` running for the dev frontend's `/api` and `/events` calls to work.
- The `monitor` command tries to `xdg-open` the dashboard URL on startup; that open failing in a headless VM is harmless and does not affect the server.

### Non-obvious caveats

- This is a network-diagnostics tool that shells out to platform commands. In the Linux VM,
  bandwidth/latency/DNS/history sampling work against the container's real interfaces, but
  Wi-Fi-specific features have no hardware to read: `/api/networks` returns `[]` and
  `signal`/`pass`/`qr` yield empty/no results. This is expected, not a bug.
- `npm run check` (in `web/`, runs `svelte-check`) reports ~26 pre-existing type errors
  (mostly `lucide-svelte`/`@lucide/svelte` icon typings under Svelte 5, plus a couple of
  union-type accesses). These do NOT block `vite build` (`npm run build`) or the dev server.
  Treat them as known/pre-existing; do not "fix" them as part of unrelated work.
- Runtime state (bandwidth/latency history, alert rules) persists to `~/.devwifi/*.json`,
  not inside the repo.
- `npm run build` runs `npm install` inside `web/` again before `vite build`, then `tsc` for
  the CLI. Building is not required to run the CLI in dev (`npm run dev -- <cmd>` uses tsx).
