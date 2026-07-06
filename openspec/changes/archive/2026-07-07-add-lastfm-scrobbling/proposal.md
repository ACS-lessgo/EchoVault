## Why

EchoVault tracks local play counts but has no way to contribute listens to a user's Last.fm profile. Last.fm scrobbling is a widely expected feature in music players — users want their local listening history reflected on their public/social Last.fm profile, and Last.fm-driven recommendations/stats depend on receiving scrobbles. Right now the only account-like setting in the app is local (theme, locale, lyrics toggle); there is no concept of connecting an external service.

## What Changes

- Add a Last.fm account connection flow: user clicks "Connect" in Settings, the app opens Last.fm's web authorization page in the user's default browser, and the user confirms back in-app once they've approved access.
- Add a "Scrobbling" section to Settings (new tab or under Audio) showing connection status (connected as `<username>` / not connected), a Connect/Disconnect button, and a toggle to enable/disable scrobbling once connected.
- Persist the Last.fm session key encrypted at rest (Electron `safeStorage`) in a main-process-owned file under `userData` — never expose the raw session key to the renderer.
- Send a "now playing" update to Last.fm when a track starts playing (if connected and enabled).
- Send a scrobble to Last.fm once a track passes the official scrobble threshold (played for at least half its duration or 4 minutes, whichever is lower, and duration > 30s), matching Last.fm's scrobbling rules.
- Queue scrobbles that fail (offline/API error) and retry them so plays aren't silently lost.
- Let each user save their own Last.fm API key/secret in Settings (from an application they register free at last.fm/api/account/create) instead of embedding one app-wide key in the build — avoids shipping a shared signing secret inside the binary.

## Capabilities

### New Capabilities
- `lastfm-scrobbling`: Connecting/disconnecting a Last.fm account from Settings, and automatically sending now-playing updates and scrobbles for played tracks according to Last.fm's scrobbling rules.

### Modified Capabilities
- (none — no existing specs cover settings or playback scrobbling)

## Impact

- **Frontend**: `src/frontend/components/Setting.vue` (new Scrobbling section/tab), `src/frontend/store/player.js` (hook now-playing/scrobble triggers into existing play/progress lifecycle), new `src/frontend/store/lastfm.js` (connection state).
- **Backend (main process)**: new `src/backend/main/lastfm.js` (IPC handlers: connect, poll-auth, disconnect, get-status, now-playing, scrobble), new `src/backend/utils/lastfmClient.js` (signed API calls, MD5 signing, retry queue).
- **Preload**: `src/preload.js` — expose `lastfm:*` IPC bridge methods.
- **Persistence**: new encrypted credentials file in `app.getPath("userData")` (via `safeStorage`); no DB schema change needed.
- **i18n**: `src/locales/en.json`, `src/locales/ja.json` — new settings strings.
- **Dependencies**: none new — Node's built-in `fetch` and `crypto` (for MD5 signing) cover all API needs.
