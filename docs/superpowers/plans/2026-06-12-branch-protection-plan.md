# Branch Protection and Ruleset Execution Plan

**Goal:** Harden repository workflow for `main` and `develop` with enforced reviews, status checks, and a clear execution plan.

## Current state
- `develop` branch created from `main`.
- Branch protection enabled on:
  - `main`
  - `develop`
- Protection rules applied:
  - required pull request review count: 1
  - dismiss stale reviews: true
  - enforce admins: true
  - prevent force pushes
  - prevent branch deletion
- Added GitHub Actions workflow: `.github/workflows/ci.yml`
  - runs on push / pull request to `main` and `develop`
  - executes `npm ci` and `npm test`

## Plan

### 1. Enforce CI before merge
- Require the `CI` status check on both `main` and `develop`.
- This ensures PRs cannot merge without passing tests.

### 2. Keep branch strategy simple
- `develop` is the active development branch.
- `main` contains release-ready code.
- All work is merged to `develop` via pull requests.
- `develop` merges to `main` only after verification.

### 3. Use branch protection as automation guardrails
- Protect `main` and `develop` against:
  - direct pushes
  - force pushes
  - branch deletion
- Require at least one approving review for all PRs.
- Enforce that review state stays fresh when new commits arrive.

### 4. Execution steps
1. Confirm the CI workflow is committed to `.github/workflows/ci.yml`.
2. Push feature branches to `origin`.
3. Open a pull request into `develop`.
4. Wait for `CI` to pass.
5. Merge once the PR has 1 approval and the CI check is green.
6. When ready for release, open a PR from `develop` into `main`.

## Next improvements
- Add a `CODEOWNERS` file for ownership-based review enforcement.
- Add a PR template to standardize merge requests.
- Add a release workflow to tag and publish versioned releases.
- Add status-check enforcement for build or lint tasks if the pipeline expands.

## Execution note
The repository now has the policy foundations to support a hacker-friendly, yet safe workflow:
- `develop` for ongoing engineering work
- `main` for stable deliverables
- GitHub Actions as the execution gate
- branch protection as the compliance guardrail
