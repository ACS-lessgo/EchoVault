## Context

EchoVault is an Electron + Vue app. Playback lives entirely in the renderer (`src/frontend/store/player.js`), driven by Web Audio API (`AudioBufferSourceNode`, not `<audio>`), with `currentTrack`, `progress` (0–1), `duration`, and `currentTime` in Pinia state, refreshed by `startProgressUpdater()`. All existing user prefs (theme, locale, `fetchLyricsOnline`) live in renderer `localStorage`. All external network calls (`lrclibClient.js`) happen in the **main** process and are invoked via IPC (`tracks:get-lyrics`), following the pattern in `src/backend/main/tracks.js` / `src/preload.js`. There is no DB `settings` table and no existing OAuth/external-account flow, deep-link protocol handling, or secret storage in the app.

Last.fm's scrobbling API (`ws.audioscrobbler.com/2.0/`) requires:
- A registered API key + shared secret per **application** (not per user).
- Desktop auth flow: `auth.getToken` (unauthenticated) → user visits `https://www.last.fm/api/auth/?api_key=...&token=...` to grant access → `auth.getSession` (signed with the token) returns a permanent `session key` for that user.
- All write calls (`track.updateNowPlaying`, `track.scrobble`) must be signed: sort params alphabetically, concatenate `key+value` pairs + the secret, MD5 hash it into `api_sig`.
- Scrobble rule: only scrobble tracks longer than 30s, once at least 50% has played or 4 minutes have played, whichever comes first.

## Goals / Non-Goals

**Goals:**
- Let a user connect their Last.fm account from Settings and see connection status.
- Send now-playing + scrobble updates automatically for local playback, matching Last.fm's official scrobble rule.
- Keep the session key out of the renderer and off disk in plaintext.
- Don't lose scrobbles just because the network hiccups.

**Non-Goals:**
- No custom URL-scheme deep link to auto-detect authorization completion — the user clicks "Connect", authorizes in the browser, then clicks "I've authorized" in-app to complete the flow. Simpler, and this app doesn't already register OS-level protocol handling for callbacks (the existing `echovault://` scheme is a buffer protocol for local images only).
- No support for other scrobbling services (Libre.fm, ListenBrainz).
- No multi-account / account switching.
- No scrobbling for tracks the user seeks around in unpredictably beyond the standard rule — we track cumulative played time, not "did they finish it."

## Decisions

**1. Auth flow: manual confirm, not a local callback server or deep link.**
`shell.openExternal()` opens the Last.fm authorize URL; a "I've authorized, continue" button in Settings triggers `auth.getSession`. Alternative considered: register `app.setAsDefaultProtocolClient` for a callback deep link — rejected as more moving parts (single-instance lock changes, OS registration, dev-mode quirks) for a one-time action the user does rarely.

**2. Credential storage: `safeStorage`-encrypted file in `userData`, main process only.**
`src/backend/main/lastfm.js` owns a `lastfm-auth.json` file (`{ encryptedApiKey, encryptedApiSecret, encryptedSessionKey, username, scrobblingEnabled }`, fields populated incrementally as the user saves credentials then completes auth) written with `safeStorage.encryptString`/`decryptString`. The renderer never receives the raw secret or session key — only status (`{hasCredentials, connected, username, scrobblingEnabled}`) over IPC. This is stricter than the existing `localStorage` pattern used for theme/locale, which is deliberate: those are non-sensitive UI prefs; a Last.fm API secret and session key are credentials.

**3. Now-playing / scrobble triggers live in the main process, driven by IPC calls from the player store.**
The renderer already knows exactly when a track starts (`setTrack`) and tracks `currentTime`/`duration` every tick (`startProgressUpdater`). Reuse that instead of duplicating a playback clock in main:
- `setTrack()` → after successful `playTrack`, call `window.api.lastfmNowPlaying({artist, title, album, duration})` (fire-and-forget, same pattern as `getLyrics()`).
- `startProgressUpdater()` gains a one-shot check: once `currentTime >= min(duration/2, 240)` (and `duration > 30`) and a scrobble hasn't been sent for this "play instance," call `window.api.lastfmScrobble({...})`. A per-track-instance flag (reset in `setTrack`) prevents double-scrobbling on seek/replay ticks.
- Manual seeking backwards before the threshold is fine — the flag only cares about highest `currentTime` reached, matching Last.fm's "half played" intent.

**4. Signing + retry queue live in `src/backend/utils/lastfmClient.js`.**
Pure functions: `buildSignature(params, secret)` (MD5 via Node's `crypto`), `getToken`, `getSession`, `updateNowPlaying`, `scrobble`. Failed scrobbles (network error / 5xx) are appended to a small JSON queue file (`lastfm-queue.json`, capped at 50 entries — oldest dropped past that, this is a local convenience queue, not a durable log) and retried opportunistically on the next successful scrobble/now-playing call or app start.

**5. API key/secret are user-supplied, not embedded in the build.**
Reversed from the original plan: Last.fm requires a key+secret pair registered to *an application*, and shipping one app-wide secret embedded in the EchoVault binary means every install shares one app identity — anyone can extract it from the binary and impersonate the app, and it hard-couples scrobbling to whoever controls the build's env vars. Instead, each user registers their own free Last.fm API application (last.fm/api/account/create — a two-field form, no approval wait) and pastes their key+secret into Settings before connecting. `lastfmClient.js` functions take `{apiKey, apiSecret}` as an explicit argument instead of reading `process.env`; `main/lastfm.js` stores them `safeStorage`-encrypted in the same `lastfm-auth.json` as the session key. This removes the whole "is this build configured" concept — there's no privileged build-time state, just "has this user saved credentials yet."

Alternative considered: keep one app-wide key via env var (original design) — rejected per the above; also considered a public shared key baked into source like `lrclibClient.js`'s `USER_AGENT` — rejected because unlike a user-agent string, this secret is used to *sign* write requests, so leaking it lets anyone scrobble as "EchoVault."

## Risks / Trade-offs

- **[Risk]** User clicks "I've authorized" before actually approving on last.fm.com → `auth.getSession` returns an error. **Mitigation**: show a toast with the error and let them retry; no partial state is persisted until `getSession` succeeds.
- **[Risk]** App closed/crashes mid-track → scrobble threshold never fires for that play. **Mitigation**: accepted — matches how most desktop scrobblers behave; not worth persisting playback position across restarts for this.
- **[Risk]** Retry queue grows if the user is offline for a long time. **Mitigation**: capped at 50 entries (oldest dropped) — acceptable data loss for a local convenience feature, not a sync-critical system.
- **[Trade-off]** Every user must register their own Last.fm API application before connecting (a couple of form fields on last.fm, no approval wait) — more friction than "just click connect," but avoids embedding a shared secret in the binary. **Mitigation**: Settings shows a direct link to the registration page next to the key/secret fields.

## Open Questions

- None blocking — if the user wants multi-account or Libre.fm/ListenBrainz support later, that's a separate change.
