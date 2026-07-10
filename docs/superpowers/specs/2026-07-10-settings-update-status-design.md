# Show update status in Settings > About

## Context

EchoVault checks GitHub Releases once on startup and shows a dismissible floating banner (`UpdateBanner.vue`) when a newer version exists. Dismissing the banner suppresses it for that version permanently (via `localStorage`), so a user who dismisses it has no other way to find out an update exists short of restarting and not dismissing. The Settings > About tab already shows the app version, but it's hardcoded (`const version = "2.2.3-beta"` in `Setting.vue`) rather than read live, so it silently drifts out of date every release.

Goal: show update status in Settings > About regardless of banner-dismiss state, with a manual "Check for Updates" button, and fix the hardcoded version display while touching this code.

## Design

**Shared state** — new Pinia store `src/frontend/store/update.js`: `{ available, version, url }`, matching the existing `store/theme.js` / `store/player.js` setup-store pattern.

**Main process** (`src/backend/main/update.js`) — add:
- `ipcMain.handle("update:check", () => checkForUpdates())` — manual, on-demand re-check, reusing the existing `checkForUpdates()` from `updateCheck.js`.
- `ipcMain.handle("app:get-version", () => app.getVersion())` — live version for the About tab (replaces the hardcoded string).
- Existing startup `setTimeout` push (`update:available`) is unchanged.

**Preload** (`src/preload.js`) — add `checkForUpdates: () => ipcRenderer.invoke("update:check")` and `getAppVersion: () => ipcRenderer.invoke("app:get-version")` alongside the existing `onUpdateAvailable`/`openExternal`.

**`App.vue`** — subscribes to `onUpdateAvailable` once at the root, writes into the new `update` store. `UpdateBanner.vue` reads from the store instead of subscribing itself, and keeps its own dismiss-per-version `localStorage` check purely to decide whether to *render the floating banner* — dismissal never touches the store itself.

**Settings About tab** (`Setting.vue`):
- Version line now reads from `window.api.getAppVersion()` (fetched on mount) instead of the hardcoded constant.
- Below it: if the update store's `available` is true, show "vX.Y.Z available" with a Download link (`window.api.openExternal(url)`); otherwise "You're up to date" once at least one check has completed (track a local `checked` boolean so we don't claim "up to date" before the first check resolves).
- A "Check for Updates" button calls `window.api.checkForUpdates()`, shows a brief loading state, and writes the result into the store (so the floating banner would also reappear on a manual-triggered find, if not dismissed for that version — expected, not a bug).

## Out of scope

No periodic/background re-checking (was a separate earlier question, not part of this change). No changes to the dismiss mechanism itself.

## Verification

- `npm run start`, open Settings > About: version shown matches `package.json`, not a stale hardcoded string.
- With no newer release published: About tab shows "up to date" after the automatic check resolves (~5s) or immediately after clicking "Check for Updates".
- Publish a test release with a higher version: dismiss the floating banner, open Settings > About — update status should still show "vX.Y.Z available" with a working Download link, proving dismiss doesn't suppress it here.
- Click "Check for Updates" with no code changes in between: should re-resolve to the same state without erroring.
