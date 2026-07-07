## 1. Client & Signing Utility

- [x] 1.1 Create `src/backend/utils/lastfmClient.js` with `buildSignature(params, secret)` using Node `crypto` MD5, and `LASTFM_API_KEY`/`LASTFM_API_SECRET` read from `process.env`
- [x] 1.2 Implement `getToken()`, `getSession(token)`, `updateNowPlaying(sessionKey, track)`, `scrobble(sessionKey, track, timestamp)` against `https://ws.audioscrobbler.com/2.0/`
- [x] 1.3 Implement a capped (50-entry) JSON-file-backed retry queue for failed now-playing/scrobble calls, with a `flushQueue()` retried opportunistically on the next successful call
- [x] 1.4 Add a test script (`test_lastfmClient.mjs`, matching `test_lrclibClient.mjs` conventions) covering signature building and threshold/queue logic

## 2. Credential Storage & Main-Process Handlers

- [x] 2.1 Create `src/backend/main/lastfm.js` with a `readAuthFile()`/`writeAuthFile()` pair using `safeStorage.encryptString`/`decryptString` against a `lastfm-auth.json` file in `app.getPath("userData")`
- [x] 2.2 Register IPC handlers: `lastfm:connect` (getToken + open external auth URL), `lastfm:confirm-auth` (getSession + persist), `lastfm:disconnect` (delete auth file), `lastfm:get-status` (`{configured, connected, username, scrobblingEnabled}`), `lastfm:set-enabled`
- [x] 2.3 Register IPC handlers: `lastfm:now-playing`, `lastfm:scrobble` — no-op silently if not connected or scrobbling disabled
- [x] 2.4 Wire `registerLastfmHandlers(mainWindow, db)` into `src/backend/main/ipcHandlers.js`

## 3. Preload Bridge

- [x] 3.1 Add `lastfm*` methods to `src/preload.js` (`connect`, `confirmAuth`, `disconnect`, `getStatus`, `setEnabled`, `nowPlaying`, `scrobble`)

## 4. Playback Hooks

- [x] 4.1 In `src/frontend/store/player.js`, add a `_scrobbled` per-play flag reset in `setTrack()`
- [x] 4.2 In `setTrack()`, after successful `playTrack`, fire-and-forget `window.api.lastfmNowPlaying({artist, title, album, duration})`
- [x] 4.3 In `startProgressUpdater()`, check the scrobble threshold (`currentTime >= Math.min(duration / 2, 240)` and `duration > 30`) each tick; when crossed and not yet scrobbled for this play, call `window.api.lastfmScrobble(...)` and set the flag
- [x] 4.4 Skip both calls when `track.artist` or `track.title` is missing

## 5. Settings UI

- [x] 5.1 Create `src/frontend/store/lastfm.js` (Pinia store) wrapping `window.api.lastfm*`, exposing `{configured, connected, username, scrobblingEnabled}` and `connect()/confirmAuth()/disconnect()/toggleEnabled()`
- [x] 5.2 Add a "Scrobbling" setting group to `src/frontend/components/Setting.vue` (Audio tab or new tab): connect/disconnect button, connected-as-username display, enable/disable toggle, and an "unavailable" state when `configured` is false
- [x] 5.3 Add the "I've authorized, continue" confirm step in the UI after clicking Connect
- [x] 5.4 Add new i18n strings to `src/locales/en.json` and `src/locales/ja.json`

## 6. Build Config

- [x] 6.1 Document `LASTFM_API_KEY`/`LASTFM_API_SECRET` env vars needed for the build (README or `.env.example`) and confirm they're available to the main process at runtime via existing Vite/Forge env handling

## 7. Verification

- [x] 7.1 Manually verify: connect flow end-to-end against a real Last.fm account, now-playing appears on the Last.fm profile, scrobble appears after threshold, disconnect clears state, toggle off stops scrobbles
- [x] 7.2 Verify offline scrobble is queued and flushed once connectivity returns

## 8. User-Supplied API Credentials (replaces build-time env from group 6)

- [x] 8.1 Refactor `src/backend/utils/lastfmClient.js`: `getToken`, `getSession`, `updateNowPlaying`, `scrobble` (and internal `request`) take `{apiKey, apiSecret}` as an explicit argument instead of reading `process.env`; remove `getCredentials()`/`isConfigured()`
- [x] 8.2 Refactor `src/backend/main/lastfm.js`: store `encryptedApiKey`/`encryptedApiSecret` in `lastfm-auth.json` alongside the session fields; add a `lastfm:save-credentials` handler; `connect`/`confirm-auth`/`now-playing`/`scrobble` read the stored key/secret instead of env; `disconnect` clears only the session key + username, keeping saved credentials
- [x] 8.3 Add `lastfmSaveCredentials(apiKey, apiSecret)` to `src/preload.js`
- [x] 8.4 Update `src/frontend/store/lastfm.js`: replace `configured` with `hasCredentials`, add `saveCredentials(apiKey, apiSecret)`
- [x] 8.5 Update `src/frontend/components/Setting.vue`: replace the "unavailable" badge with an API key/secret input form (shown when `!hasCredentials`) linking to last.fm/api/account/create; Connect button shows once credentials are saved
- [x] 8.6 Update i18n (`en.json`/`ja.json`): drop `unavailable`, add `apiKeyLabel`, `apiSecretLabel`, `credentialsHint`, `saveAndConnect`
- [x] 8.7 Remove build-time env plumbing: revert the `.env` load in `src/main.js`, delete `.env.example`, remove the "Last.fm Scrobbling (optional)" README section
- [x] 8.8 Update `test_lastfmClient.mjs` for the new `{apiKey, apiSecret}`-argument function signatures
- [x] 8.9 Re-run the `npm run start` smoke test after the refactor
