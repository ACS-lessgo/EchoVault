# Library Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Library stats-dashboard page with a minimal content-browse hub (header counts, Recently Added row, section links), matching premium-app conventions (Apple Music / Spotify) instead of an analytics panel.

**Architecture:** New component `Library.vue` replaces `LibraryInfo.vue` at the `/library` route. A small backend addition (`tracks:get-recent`) supplies the Recently Added row using `id DESC` as a zero-migration recency proxy (the `tracks` table has no timestamp column). Dead `stats.*`/related i18n keys are removed; a few new `library.*` keys are added.

**Tech Stack:** Vue 3 `<script setup>`, vue-router, vue-i18n, `@lucide/vue` icons, `better-sqlite3` (main process). No test framework in this repo (per `CLAUDE.md`) — verification is manual.

## Global Constraints

- ESM throughout `src/` (per `CLAUDE.md`).
- User-facing strings go through vue-i18n — new keys added to both `src/locales/en.json` and `src/locales/ja.json`.
- Logging via `electron-log`, tagged `"<module> :: <message>"` — applies to the new main-process handler in Task 1.
- No `console.log` in new code.

---

### Task 1: Add `tracks:get-recent` backend capability

**Files:**
- Modify: `src/backend/db/queries.js`
- Modify: `src/backend/main/tracks.js`
- Modify: `src/preload.js`

**Interfaces:**
- Produces: `window.api.getRecentTracks()` → `Promise<Track[]>`, ordered most-recently-inserted first, limited to 15 rows. Consumed by Task 3 (`Library.vue`).

- [ ] **Step 1: Add the query constant**

In `src/backend/db/queries.js`, find:
```js
//  Tracks
export const GET_TRACKS = `SELECT * FROM tracks ORDER BY LOWER(title)`
```
Add directly below it:
```js
//  Tracks
export const GET_TRACKS = `SELECT * FROM tracks ORDER BY LOWER(title)`
export const GET_RECENT_TRACKS = `SELECT * FROM tracks ORDER BY id DESC LIMIT 15`
```

- [ ] **Step 2: Register the IPC handler**

In `src/backend/main/tracks.js`, find:
```js
import { GET_TRACKS, GET_LIKED_TRACKS, UPDATE_LIKE } from "../db/queries.js"
```
Replace with:
```js
import {
  GET_TRACKS,
  GET_RECENT_TRACKS,
  GET_LIKED_TRACKS,
  UPDATE_LIKE,
} from "../db/queries.js"
```

Then find:
```js
  // tracks
  ipcMain.handle("tracks:get-tracks", () => db.prepare(GET_TRACKS).all())
```
Replace with:
```js
  // tracks
  ipcMain.handle("tracks:get-tracks", () => db.prepare(GET_TRACKS).all())
  ipcMain.handle("tracks:get-recent", () => db.prepare(GET_RECENT_TRACKS).all())
```

- [ ] **Step 3: Expose it in preload**

In `src/preload.js`, find:
```js
  getTracks: () => ipcRenderer.invoke("tracks:get-tracks"),
```
Replace with:
```js
  getTracks: () => ipcRenderer.invoke("tracks:get-tracks"),
  getRecentTracks: () => ipcRenderer.invoke("tracks:get-recent"),
```

- [ ] **Step 4: Verify with a quick manual check**

Run: `npm run start`, wait for the app window, then check the terminal log for any IPC registration errors. No dedicated test — full behavioral check happens in Task 5 once `Library.vue` calls this.

- [ ] **Step 5: Commit**

```bash
git add src/backend/db/queries.js src/backend/main/tracks.js src/preload.js
git commit -m "feat: add tracks:get-recent IPC for Recently Added row"
```

---

### Task 2: Update i18n keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/ja.json`

**Interfaces:**
- Produces: `library.title`, `library.recentlyAdded`, `library.emptyTitle`, `library.emptyText`, `library.addFolderCta`, `library.artists`, `library.playlists`, `library.folders` — consumed by Task 3.
- Removes: the entire `stats` block and `labels.perTrack`, `labels.uniqueAlbums`, `labels.noPlaylists` (verified via grep to have zero other consumers — see Step 3).

- [ ] **Step 1: Extend the existing `library` block in `en.json`**

Find:
```json
  "library": {
    "folderManagement": "Manage Folders"
  },
```
Replace with:
```json
  "library": {
    "folderManagement": "Manage Folders",
    "title": "Library",
    "recentlyAdded": "Recently Added",
    "emptyTitle": "Your library is empty",
    "emptyText": "Add a folder to start building your collection.",
    "addFolderCta": "Add a Folder",
    "artists": "artists",
    "playlists": "playlists",
    "folders": "folders"
  },
```

- [ ] **Step 2: Remove the dead `stats` block in `en.json`**

Find:
```json
  "stats": {
    "title": "Library Statistics",
    "totalTracks": "Total Tracks",
    "artists": "Artists",
    "likedSongs": "Liked Songs",
    "storageUsed": "Storage Used",
    "folders": "Folders",
    "totalDuration": "Total Duration",
    "listeningTime": "Listening Time",
    "top": {
      "title": "Top Statistics",
      "mostLikedArtist": "Most Liked Artist",
      "likedCount": "{count} liked songs",
      "avgDurationTitle": "Average Song Duration",
      "collectionSize": "Collection Size",
      "totalPlays": "Total Plays",
      "topTracksTitle": "Top 10 Most Played Songs",
      "noPlaysTracks": "No plays recorded yet. Start listening to see your top tracks!",
      "topArtistsTitle": "Top 10 Most Played Artists",
      "noPlaysArtists": "No plays recorded yet. Start listening to see your top artists!",
      "trackCountInLibrary": "{count} tracks in library",
      "playlists": "Playlists"
    }
  },

  "alt": {
```
Replace with:
```json
  "alt": {
```

- [ ] **Step 3: Remove the three dead `labels` keys in `en.json`**

First verify they're truly unused outside the file being deleted in Task 4:
Run: `grep -rn '"labels\.perTrack"\|"labels\.uniqueAlbums"\|"labels\.noPlaylists"\|labels\.perTrack\|labels\.uniqueAlbums\|labels\.noPlaylists' src/frontend`
Expected: only matches in `src/frontend/components/LibraryInfo.vue` (the file Task 4 deletes). If any other file matches, stop and keep that specific key instead of removing it.

Find:
```json
  "labels": {
    "equalizer": "Equalizer",
    "perTrack": "per track",
    "uniqueAlbums": "unique albums",
    "allTime": "all time",
    "unknownArtist": "Unknown Artist",
    "plays": "plays",
    "noTrackSelected": "No track selected",
    "tracks": "tracks",
    "noPlaylists": "No playlists",
    "noLyricsFound": "No lyrics found"
  },
```
Replace with:
```json
  "labels": {
    "equalizer": "Equalizer",
    "allTime": "all time",
    "unknownArtist": "Unknown Artist",
    "plays": "plays",
    "noTrackSelected": "No track selected",
    "tracks": "tracks",
    "noLyricsFound": "No lyrics found"
  },
```

- [ ] **Step 4: Mirror all three changes in `ja.json`**

Find:
```json
  "library": {
    "folderManagement": "フォルダを管理"
  },
```
Replace with:
```json
  "library": {
    "folderManagement": "フォルダを管理",
    "title": "ライブラリ",
    "recentlyAdded": "最近追加した項目",
    "emptyTitle": "ライブラリが空です",
    "emptyText": "フォルダを追加してコレクションを作りましょう。",
    "addFolderCta": "フォルダを追加",
    "artists": "アーティスト",
    "playlists": "プレイリスト",
    "folders": "フォルダ"
  },
```

Then find `ja.json`'s `"stats"` block (same shape as `en.json`'s, translated) and remove it the same way as Step 2 — delete from `"stats": {` through its closing `},` immediately before the `"alt"` block.

Then find `ja.json`'s `"labels"` block and remove the `perTrack`, `uniqueAlbums`, `noPlaylists` entries the same way as Step 3 (keep `equalizer`, `allTime`, `unknownArtist`, `plays`, `noTrackSelected`, `tracks`, `noLyricsFound`).

- [ ] **Step 5: Verify both files are valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/locales/en.json'))" && node -e "JSON.parse(require('fs').readFileSync('src/locales/ja.json'))" && echo OK`
Expected: `OK`

- [ ] **Step 6: Commit**

```bash
git add src/locales/en.json src/locales/ja.json
git commit -m "i18n: add library.* keys for redesigned Library page, remove dead stats.* keys"
```

---

### Task 3: Create Library.vue

**Files:**
- Create: `src/frontend/components/Library.vue`

**Interfaces:**
- Consumes: `window.api.getTracks()`, `window.api.getArtists()`, `window.api.getPlaylists()`, `window.api.getFolders()`, `window.api.getRecentTracks()` (Task 1); `attachCoverUrl` from `src/frontend/utils/trackFormat.js` (existing shared util); `usePlayerStore` from `src/frontend/store/player.js` (existing).
- Produces: default-exported Vue component, no props/emits — mounted by the router (Task 4).

- [ ] **Step 1: Write the file**

```vue
<template>
  <div class="library-page">
    <header class="library-header">
      <h1>{{ t("library.title") }}</h1>
      <div class="library-meta" v-if="totalTracks > 0">
        <span>{{ totalTracks }} songs</span>
        <span>•</span>
        <span>{{ totalArtists }} artists</span>
        <span>•</span>
        <span>{{ totalAlbums }} albums</span>
      </div>
    </header>

    <section v-if="totalTracks === 0" class="empty-state">
      <i class="fas fa-music empty-icon"></i>
      <h2>{{ t("library.emptyTitle") }}</h2>
      <p>{{ t("library.emptyText") }}</p>
      <button class="accent-btn" @click="router.push('/media')">
        {{ t("library.addFolderCta") }}
      </button>
    </section>

    <section v-else>
      <div class="section-title">
        <h2>{{ t("library.recentlyAdded") }}</h2>
      </div>
      <div class="recent-row">
        <div
          v-for="track in recentTracks"
          :key="track.id"
          class="recent-card"
          @click="playRecent(track)"
        >
          <img
            v-if="track.coverDataUrl"
            :src="track.coverDataUrl"
            class="recent-cover"
          />
          <div v-else class="recent-cover default-cover">
            <i class="fas fa-music"></i>
          </div>
          <div class="recent-title">{{ track.title }}</div>
          <div class="recent-artist">{{ track.artist || "Unknown Artist" }}</div>
        </div>
      </div>
    </section>

    <section>
      <div class="section-links">
        <div class="link-card" @click="router.push('/songs')">
          <Music class="link-icon" :size="28" />
          <div class="link-title">{{ t("nav.allSongs") }}</div>
          <div class="link-sub">{{ totalTracks }} {{ t("labels.tracks") }}</div>
        </div>
        <div class="link-card" @click="router.push('/artists')">
          <User class="link-icon" :size="28" />
          <div class="link-title">{{ t("nav.artists") }}</div>
          <div class="link-sub">{{ totalArtists }} {{ t("library.artists") }}</div>
        </div>
        <div class="link-card" @click="router.push('/playlists')">
          <ListMusic class="link-icon" :size="28" />
          <div class="link-title">{{ t("nav.playlists") }}</div>
          <div class="link-sub">{{ totalPlaylists }} {{ t("library.playlists") }}</div>
        </div>
        <div class="link-card" @click="router.push('/media')">
          <FolderCog class="link-icon" :size="28" />
          <div class="link-title">{{ t("nav.media") }}</div>
          <div class="link-sub">{{ totalFolders }} {{ t("library.folders") }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import { Music, User, ListMusic, FolderCog } from "@lucide/vue"
import { usePlayerStore } from "../store/player.js"
import { attachCoverUrl } from "../utils/trackFormat.js"

const { t } = useI18n()
const router = useRouter()
const player = usePlayerStore()

const totalTracks = ref(0)
const totalArtists = ref(0)
const totalAlbums = ref(0)
const totalPlaylists = ref(0)
const totalFolders = ref(0)
const recentTracks = ref([])

async function loadCounts() {
  const [tracks, artists, playlists, folders] = await Promise.all([
    window.api.getTracks(),
    window.api.getArtists(),
    window.api.getPlaylists(),
    window.api.getFolders(),
  ])

  totalTracks.value = tracks.length
  totalArtists.value = artists.length
  totalAlbums.value = new Set(tracks.map((t) => t.album).filter(Boolean)).size
  totalPlaylists.value = playlists?.length || 0
  totalFolders.value = folders.length
}

async function loadRecentTracks() {
  const tracks = await window.api.getRecentTracks()
  recentTracks.value = tracks.map(attachCoverUrl)
}

function playRecent(track) {
  if (player.queueSource !== "library-recent") {
    player.clearQueue()
    player.queue = recentTracks.value.map((t) => ({ ...t }))
    player.queueSource = "library-recent"
  }

  const index = player.queue.findIndex((t) => t.file_path === track.file_path)
  if (index !== -1) {
    player.currentIndex = index
    player.setTrack(player.queue[index], false)
  } else {
    player.setTrack(track)
  }
}

onMounted(async () => {
  await Promise.all([loadCounts(), loadRecentTracks()])
})
</script>

<style scoped>
.library-page {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 36px;
  background: linear-gradient(180deg, #171717, #111111);
  min-height: 100%;
}

.library-header h1 {
  font-size: 40px;
  margin: 0.25rem 0 1rem;
  color: var(--text-color);
}

.library-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: var(--muted-text);
  font-size: 15px;
  font-weight: 500;
}

.library-meta span:nth-child(even) {
  opacity: 0.35;
}

.section-title {
  margin-bottom: 16px;
}

.section-title h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

/* Recently Added horizontal row */
.recent-row {
  display: flex;
  gap: 18px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.recent-card {
  flex: 0 0 160px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.recent-card:hover {
  transform: translateY(-4px);
}

.recent-cover {
  width: 160px;
  height: 160px;
  border-radius: 12px;
  object-fit: cover;
  background: var(--topbar-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.recent-cover.default-cover {
  color: var(--muted-text);
  font-size: 32px;
}

.recent-title {
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-artist {
  font-size: 13px;
  color: var(--muted-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Section link cards */
.section-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.link-card {
  background: var(--side-nav-bg);
  border-radius: 18px;
  padding: 24px;
  cursor: pointer;
  transition: 0.2s;
}

.link-card:hover {
  background: var(--hover-bg);
  transform: translateY(-3px);
}

.link-icon {
  color: var(--accent);
  margin-bottom: 12px;
}

.link-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 4px;
}

.link-sub {
  font-size: 13px;
  color: var(--muted-text);
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px;
  gap: 16px;
}

.empty-icon {
  font-size: 72px;
  opacity: 0.4;
}

.accent-btn {
  padding: 12px 18px;
  border: none;
  border-radius: 12px;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
}

.accent-btn:hover {
  background: var(--accent-hover);
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/frontend/components/Library.vue
git commit -m "feat: add redesigned minimal Library.vue (Recently Added + section links)"
```

---

### Task 4: Remove LibraryInfo.vue and update routing

**Files:**
- Delete: `src/frontend/components/LibraryInfo.vue`
- Modify: `src/frontend/router/index.js`

**Interfaces:**
- Produces: `/library` route now serves `Library.vue` instead of `LibraryInfo.vue`.

- [ ] **Step 1: Update the router import and registration**

In `src/frontend/router/index.js`, find:
```js
import LibraryInfo from "../components/LibraryInfo.vue"
import MediaManagement from "../components/MediaManagement.vue"
```
Replace with:
```js
import Library from "../components/Library.vue"
import MediaManagement from "../components/MediaManagement.vue"
```

Then find:
```js
  { path: "/library", component: LibraryInfo },
```
Replace with:
```js
  { path: "/library", component: Library },
```

- [ ] **Step 2: Confirm nothing else references `LibraryInfo`**

Run: `grep -rn "LibraryInfo" src/`
Expected: no matches.

- [ ] **Step 3: Delete the old file**

Run: `rm src/frontend/components/LibraryInfo.vue`

- [ ] **Step 4: Commit**

```bash
git add -A src/frontend/router/index.js src/frontend/components/LibraryInfo.vue
git commit -m "refactor: replace LibraryInfo.vue with Library.vue at /library route"
```

---

### Task 5: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the app**

Run: `npm run start`
Expected: app window opens, no compile/import errors in the terminal output.

- [ ] **Step 2: Check the Library page**

Navigate to Library (sidebar). Confirm:
- Header shows "Library" + a one-line count string (songs/artists/albums), no counting-up animation.
- "Recently Added" row shows up to 15 tracks as horizontally scrollable cover cards.
- A 2×2 grid of link cards: All Songs, Artists, Playlists, Media Management, each with an icon and a count subtitle.
- No stat-dashboard content (cards, info grid, top lists, refresh button) remains anywhere.

- [ ] **Step 3: Exercise interactions**

- Click a Recently Added card → confirm the track starts playing.
- Click each of the four link cards → confirm navigation to `/songs`, `/artists`, `/playlists`, `/media` respectively.

- [ ] **Step 4: Check the empty-library case**

If possible, temporarily test with a library that has zero tracks (or reason about the `v-if="totalTracks === 0"` branch by inspection): confirm the Recently Added row is replaced by the empty-state block with a working "Add a Folder" button routing to `/media`, and the section links grid still renders.

- [ ] **Step 5: Check i18n**

Switch the app language to Japanese (if a language switcher exists in Settings) and confirm the Library page's new strings render translated, not as raw keys.

- [ ] **Step 6: Report results**

If all checks pass, report done. If anything fails, note exactly which step and what was observed — return to the relevant task above rather than patching ad hoc.
