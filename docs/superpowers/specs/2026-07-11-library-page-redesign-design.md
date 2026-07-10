# Library page redesign

## Context

The Library page (`LibraryInfo.vue`) reads as a dashboard: seven animated stat cards, five info cards, two top-lists, and (until the Media Management extraction) a folder manager. Premium music apps (Apple Music, Spotify) treat their "Library" screen as a minimal browse surface, not an analytics panel. This redesign replaces the dashboard content with a content-browse hub, matching that feel, and removes the animated-counter machinery entirely — the same machinery responsible for this page's earlier loading-jitter bugs.

## Design

**Purpose:** Library becomes the app's "browse everything" hub — distinct from `HomePage.vue`, which stays the "for you" surface (Your Playlists, Most Played). No content duplication between the two pages.

**Header**
- `<h1>` reading "Library" (reuse the `nav.library` string or a new `library.title` key — decide exact key in implementation).
- One thin text line below it: `{tracks} songs • {artists} artists • {albums} albums`, plain numbers, no counting-up animation. Mirrors the existing one-line pattern in `HomePage.vue`'s `.library-meta`.

**Recently Added**
- Horizontal scrolling row of the 15 most recently added tracks, cover-art cards (same visual language as `HomePage.vue`'s track rows/playlist cards — reuse `.cover`/`.default-cover` styling conventions already established there).
- Clicking a card plays that track, following the existing `playTrack`-style pattern used on `HomePage.vue` and `AllSongs.vue` (clear queue if queue source differs, set queue, play).
- Backend addition required: `tracks` has no timestamp column. `id` is autoincrement and rows are inserted in scan order, so `ORDER BY id DESC LIMIT 15` is a correct zero-migration proxy for recency. Add:
  - `GET_RECENT_TRACKS` query constant in `src/backend/db/queries.js`.
  - IPC handler `tracks:get-recent` in `src/backend/main/tracks.js` (mirroring the existing `tracks:get-tracks` handler).
  - `getRecentTracks: () => ipcRenderer.invoke("tracks:get-recent")` in `src/preload.js`.

**Section links**
- A 2×2 grid of large link cards: All Songs, Artists, Playlists, Media Management.
- Each card: icon (`Music`, `User`, `ListMusic`, `FolderCog` — already imported in `SideNav.vue`, reused here) + label + one-line count subtitle ("128 tracks", "8 artists", "12 playlists", "3 folders").
- Clicking a card navigates via `router.push` to `/songs`, `/artists`, `/playlists`, `/media` respectively.

**Empty state**
- If `totalTracks === 0`: skip the Recently Added row entirely, show one centered empty-state block (icon + message + a link/button to `/media` to add a folder). Mirrors the empty-state block already in `HomePage.vue`.
- Section links grid still renders even when empty (it's just navigation, not content-dependent).

**Data loading**
- On mount: fetch track/artist/album/playlist counts (same calls `HomePage.vue`'s `loadLibraryStats` already makes — `getTracks`, `getArtists`, `getPlaylists`, folder count via `getFolders`) and the new `getRecentTracks()`. No sequential-await-per-track loops, no `requestAnimationFrame` counters — this page's data needs are now small enough that none of the prior performance work (Bug 6/7 fixes) is relevant here; the redesign removes the code paths that needed it.

**Naming and cleanup**
- Rename `src/frontend/components/LibraryInfo.vue` → `src/frontend/components/Library.vue`. Update the one import/registration in `src/frontend/router/index.js` (`LibraryInfo` → `Library`). No other file references the component by name (`SideNav.vue` only references the route path `/library`, not the component name).
- Remove the now-dead `stats.*` locale keys (the seven stat-card labels, `stats.top.*` info-card and top-list strings) from `src/locales/en.json` and `src/locales/ja.json`, since nothing will reference them after this page is rewritten. Keep `stats.folders`/`stats.totalTracks`-equivalent concepts only if still used elsewhere (verify via grep in implementation before deleting each key — some may be shared).
- No changes to `HomePage.vue`, `AllSongs.vue`, `Artists.vue`, `Playlists.vue`, `MediaManagement.vue`, or `SideNav.vue` beyond what's listed above.

## Files touched

- `src/frontend/components/LibraryInfo.vue` → renamed and rewritten as `src/frontend/components/Library.vue`
- `src/frontend/router/index.js` — update import/registration
- `src/backend/db/queries.js` — add `GET_RECENT_TRACKS`
- `src/backend/main/tracks.js` — add `tracks:get-recent` handler
- `src/preload.js` — add `getRecentTracks`
- `src/locales/en.json`, `src/locales/ja.json` — remove dead `stats.*` keys, add any new keys the rewritten page needs (e.g. `library.title` if not reusing `nav.library`)

## Verification

Manual, in the running app (no automated test suite in this repo per `CLAUDE.md`):
1. Library page shows: title, one-line counts, Recently Added row (newest-scanned tracks first), 2×2 section link grid.
2. Clicking a Recently Added card plays that track.
3. Clicking each section link card navigates to the correct route.
4. With zero tracks in the library: Recently Added row is absent, empty state shows instead, section links still present.
5. No stat-dashboard content (cards, info grid, top lists) remains anywhere on this page.
6. No console errors; no dead i18n key warnings for keys actually still in use elsewhere (spot-check via grep before deleting).
