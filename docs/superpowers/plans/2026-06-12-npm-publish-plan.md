# npm Publish Plan for devwifi

## Objective
Publish the `devwifi` package to npm so `npm install -g devwifi` works. Until then, installation should be done from the repository source.

## Status
- The package name `devwifi` is currently available on npm.
- The repository builds successfully with `npm run build`.
- Local global install works with `npm install -g .`.

## Steps

1. Confirm package metadata
   - `name`: `devwifi`
   - `version`: `1.0.0`
   - `bin.devwifi`: `./dist/index.js`
   - `files`: `dist`, `web/dist`

2. Ensure build artifacts are current
   - `npm install`
   - `npm run build`
   - `npm pack` (optional verification)

3. Publish to npm
   - `npm login`
   - `npm publish`

4. Verify published package
   - `npm view devwifi version`
   - `npm install -g devwifi`

## Notes
- The package currently relies on a local source install for users until publication.
- `npm audit` reports vulnerabilities in dev dependencies (`vitest`, `vite`, `postcss`) but these do not affect package runtime.
- If you want to harden the repo before publish, upgrade `vitest` and associated dev dependencies.

## Recommended follow-up
- Add a `publish` GitHub Actions workflow to build and publish automatically on tagged releases.
- Add a `CODEOWNERS` file and PR template for easier maintenance.
