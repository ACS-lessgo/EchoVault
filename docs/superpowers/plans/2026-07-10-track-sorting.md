# Track Sorting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-dropdown sort control (field + direction) to the All Songs page and the playlist detail view, so users can reorder tracks by Name/Artist/Album/Duration, with the choice persisted and playback (Next/Prev/Shuffle) always matching what's on screen.

**Architecture:** A new plain-JS reactive helper (`useTrackSort`) owns sort state + the sorting algorithm + localStorage persistence. A new presentational component (`TrackSortControls`) renders the two pill dropdowns and is driven via `v-model`. Both `AllSongs.vue` and `Playlists.vue` call the helper, pass its `sortedTracks` output to `TrackList`/`TrackGrid` instead of their raw track arrays, and rebuild the playback queue from that same sorted array.

**Tech Stack:** Vue 3 Composition API (`<script setup>`), no new dependencies.

## Global Constraints

- No test runner is configured in this repo (`CLAUDE.md`: "`npm run lint` is a no-op; there are no tests wired up"). Do NOT add a test framework as part of this feature. Pure-logic verification uses a throwaway `node -e` snippet with Node's built-in `assert` (no install needed); UI wiring is verified by running `npm run start` and interacting with the app.
- Reactive helper functions that hold `ref`/`computed` state live in `src/frontend/utils/` in this codebase (see `src/frontend/utils/miniPlayerState.js` — exports a module-level `ref` + functions), not a `composables/` directory. Follow that precedent: `useTrackSort.js` goes in `utils/`.
- User-facing strings go through `vue-i18n` — add keys to both `src/locales/en.json` and `src/locales/ja.json` (per `CLAUDE.md` conventions).
- ESM throughout `src/`, plain JS (no TypeScript anywhere in this codebase) — do not add `lang="ts"` or type annotations, match existing `.vue`/`.js` files.
- Design source of truth: `docs/superpowers/specs/2026-07-10-track-sorting-design.md`.

---

### Task 1: `useTrackSort` helper — sort state, algorithm, persistence

**Files:**
- Create: `src/frontend/utils/useTrackSort.js`

**Interfaces:**
- Consumes: nothing (pure Vue reactivity + `localStorage`, no other project files).
- Produces: `useTrackSort(tracksRef, storageKey)` → `{ sortField, sortDirection, sortedTracks, setSortField, setSortDirection }`, and a named export `SORT_FIELDS = ["default", "name", "artist", "album", "duration"]`. `sortField`/`sortDirection` are refs (`.value` is a string). `sortedTracks` is a computed array. `setSortField(field)`/`setSortDirection(direction)` are plain setter functions. Task 2 and Tasks 3/4 depend on these exact names.

- [ ] **Step 1: Write the helper**

```js
import { ref, computed, watch } from "vue"

export const SORT_FIELDS = ["default", "name", "artist", "album", "duration"]

export function useTrackSort(tracksRef, storageKey) {
  const stored = JSON.parse(localStorage.getItem(storageKey) || "null")
  const sortField = ref(stored?.field ?? "default")
  const sortDirection = ref(stored?.direction ?? "asc")

  watch([sortField, sortDirection], () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ field: sortField.value, direction: sortDirection.value })
    )
  })

  const sortedTracks = computed(() => {
    const list = tracksRef.value
    if (sortField.value === "default") return list
    const dir = sortDirection.value === "desc" ? -1 : 1
    const key = sortField.value === "name" ? "title" : sortField.value
    return [...list].sort((a, b) => {
      if (key === "duration") return ((a.duration ?? 0) - (b.duration ?? 0)) * dir
      return String(a[key] ?? "").localeCompare(String(b[key] ?? "")) * dir
    })
  })

  function setSortField(field) {
    sortField.value = field
  }

  function setSortDirection(direction) {
    sortDirection.value = direction
  }

  return { sortField, sortDirection, sortedTracks, setSortField, setSortDirection }
}
```

- [ ] **Step 2: Verify the sort algorithm with a throwaway Node check**

This is plain reactivity-free logic apart from `ref`/`computed`/`watch`/`localStorage`, which aren't available outside a browser/Vue context — so verify the pure comparison logic in isolation by copy-pasting just the comparator into a scratch file and running it with Node's built-in `assert`. Do not commit this file.

Create a temporary file `/tmp/verify-sort.mjs`:

```js
import assert from "node:assert"

function sortTracks(list, field, direction) {
  if (field === "default") return list
  const dir = direction === "desc" ? -1 : 1
  const key = field === "name" ? "title" : field
  return [...list].sort((a, b) => {
    if (key === "duration") return ((a.duration ?? 0) - (b.duration ?? 0)) * dir
    return String(a[key] ?? "").localeCompare(String(b[key] ?? "")) * dir
  })
}

const tracks = [
  { title: "Zebra", artist: "Bea", album: "M", duration: 120 },
  { title: "Apple", artist: "Amy", album: "Z", duration: 300 },
  { title: "Mango", artist: "Cid", album: "A", duration: 60 },
]

assert.deepStrictEqual(
  sortTracks(tracks, "name", "asc").map((t) => t.title),
  ["Apple", "Mango", "Zebra"]
)
assert.deepStrictEqual(
  sortTracks(tracks, "artist", "desc").map((t) => t.artist),
  ["Cid", "Bea", "Amy"]
)
assert.deepStrictEqual(
  sortTracks(tracks, "duration", "asc").map((t) => t.duration),
  [60, 120, 300]
)
assert.deepStrictEqual(
  sortTracks(tracks, "default", "asc").map((t) => t.title),
  ["Zebra", "Apple", "Mango"]
)
assert.deepStrictEqual(
  sortTracks([{ title: "No duration" }], "duration", "asc").map((t) => t.duration ?? 0),
  [0]
)

console.log("all sort assertions passed")
```

Run: `node /tmp/verify-sort.mjs`
Expected output: `all sort assertions passed`

If it fails, fix the comparator in `src/frontend/utils/useTrackSort.js` (keep both copies in sync) and rerun until it passes. Then delete the scratch file: `rm /tmp/verify-sort.mjs`.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/utils/useTrackSort.js
git commit -m "feat: add useTrackSort helper for sortable track lists"
```

---

### Task 2: `TrackSortControls.vue` — the two dropdown pills

**Files:**
- Create: `src/frontend/components/TrackSortControls.vue`

**Interfaces:**
- Consumes: `SORT_FIELDS` from `src/frontend/utils/useTrackSort.js` (Task 1).
- Produces: a component with props `sortField: String`, `sortDirection: String`, emits `update:sortField`, `update:sortDirection` — used as `<TrackSortControls v-model:sortField="..." v-model:sortDirection="..." />` by Tasks 3 and 4.

- [ ] **Step 1: Write the component**

```vue
<template>
  <div class="sort-controls">
    <div class="sort-dropdown">
      <button class="sort-btn" @click="fieldOpen = !fieldOpen" @blur="onFieldBlur">
        <ArrowUpDown :size="14" />
        <span>{{ t(`sort.${sortField}`) }}</span>
        <ChevronDown :size="14" />
      </button>
      <div v-if="fieldOpen" class="sort-menu">
        <div
          v-for="field in SORT_FIELDS"
          :key="field"
          class="sort-menu-item"
          :class="{ active: field === sortField }"
          @mousedown.prevent="selectField(field)"
        >
          {{ t(`sort.${field}`) }}
        </div>
      </div>
    </div>

    <div class="sort-dropdown" :class="{ disabled: sortField === 'default' }">
      <button
        class="sort-btn"
        :disabled="sortField === 'default'"
        @click="directionOpen = !directionOpen"
        @blur="onDirectionBlur"
      >
        <ArrowUpDown :size="14" />
        <span>{{ t(`sort.${sortDirection === 'desc' ? 'descending' : 'ascending'}`) }}</span>
        <ChevronDown :size="14" />
      </button>
      <div v-if="directionOpen" class="sort-menu">
        <div
          class="sort-menu-item"
          :class="{ active: sortDirection === 'asc' }"
          @mousedown.prevent="selectDirection('asc')"
        >
          {{ t("sort.ascending") }}
        </div>
        <div
          class="sort-menu-item"
          :class="{ active: sortDirection === 'desc' }"
          @mousedown.prevent="selectDirection('desc')"
        >
          {{ t("sort.descending") }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { ArrowUpDown, ChevronDown } from "@lucide/vue"
import { SORT_FIELDS } from "../utils/useTrackSort.js"

const { t } = useI18n()

defineProps({
  sortField: { type: String, required: true },
  sortDirection: { type: String, required: true },
})
const emit = defineEmits(["update:sortField", "update:sortDirection"])

const fieldOpen = ref(false)
const directionOpen = ref(false)

function selectField(field) {
  emit("update:sortField", field)
  fieldOpen.value = false
}

function selectDirection(direction) {
  emit("update:sortDirection", direction)
  directionOpen.value = false
}

function onFieldBlur() {
  setTimeout(() => (fieldOpen.value = false), 0)
}

function onDirectionBlur() {
  setTimeout(() => (directionOpen.value = false), 0)
}
</script>

<style scoped>
.sort-controls {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
  margin-bottom: var(--space-3);
}

.sort-dropdown {
  position: relative;
}

.sort-dropdown.disabled {
  opacity: 0.5;
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--side-nav-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
}

.sort-btn:disabled {
  cursor: not-allowed;
}

.sort-btn:hover:not(:disabled) {
  background: var(--hover-bg);
}

.sort-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  min-width: 160px;
  background: var(--side-nav-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 6px 0;
  z-index: 20;
}

.sort-menu-item {
  padding: 8px 14px;
  font-size: 14px;
  cursor: pointer;
}

.sort-menu-item:hover {
  background: var(--hover-bg);
}

.sort-menu-item.active {
  color: var(--accent);
  font-weight: 600;
}
</style>
```

- [ ] **Step 2: Manual verification (no test runner in this repo)**

This component has no consumer yet, so it can't be exercised in the running app until Task 3. Confirm only that it has no syntax errors by running the Vite dev build check:

Run: `cd /home/crimson/Documents/VS-CODE-WORKSPACE/EchoVault && npx vite build --config vite.renderer.config.mjs 2>&1 | tail -30`
Expected: build completes without an error referencing `TrackSortControls.vue` (unused-file warnings, if any, are fine — it's not imported yet).

- [ ] **Step 3: Commit**

```bash
git add src/frontend/components/TrackSortControls.vue
git commit -m "feat: add TrackSortControls dropdown component"
```

---

### Task 3: Wire sorting into `AllSongs.vue`

**Files:**
- Modify: `src/frontend/components/AllSongs.vue`

**Interfaces:**
- Consumes: `useTrackSort` from Task 1 (`src/frontend/utils/useTrackSort.js`), `TrackSortControls` from Task 2 (`src/frontend/components/TrackSortControls.vue`).
- Produces: nothing new consumed by other tasks — this is a leaf wiring task.

- [ ] **Step 1: Add the import and composable call**

In `src/frontend/components/AllSongs.vue`, find this existing block near the top of `<script setup>`:

```js
import { ref, onMounted, nextTick, watch } from "vue"
import { useSearchStore } from "../store/search.js"
import { usePlayerStore } from "../store/player.js"
import { useEnhanceStore } from "../store/enhance.js"
import { useI18n } from "vue-i18n"
import TrackList from "./TrackList.vue"
import TrackGrid from "./TrackGrid.vue"

const { t } = useI18n()
const tracks = ref([])
const playlists = ref([])
const viewMode = ref("list")
```

Replace it with:

```js
import { ref, onMounted, nextTick, watch } from "vue"
import { useSearchStore } from "../store/search.js"
import { usePlayerStore } from "../store/player.js"
import { useEnhanceStore } from "../store/enhance.js"
import { useI18n } from "vue-i18n"
import TrackList from "./TrackList.vue"
import TrackGrid from "./TrackGrid.vue"
import TrackSortControls from "./TrackSortControls.vue"
import { useTrackSort } from "../utils/useTrackSort.js"

const { t } = useI18n()
const tracks = ref([])
const playlists = ref([])
const viewMode = ref("list")
const { sortField, sortDirection, sortedTracks } = useTrackSort(
  tracks,
  "echovault-sort-all-songs"
)
```

- [ ] **Step 2: Use `sortedTracks` for the playback queue**

Find this function further down in the same file:

```js
function playCurrentTrack(track) {
  if (player.queueSource !== "all") {
    player.clearQueue()
    player.queue = tracks.value.map((t) => ({ ...t }))
    player.queueSource = "all"
  }

  const index = player.queue.findIndex((t) => t.file_path === track.file_path)
  if (index !== -1) {
    player.currentIndex = index
    player.setTrack(player.queue[index], false)
  } else {
    player.setTrack(track)
  }
}
```

Replace the queue-building line so Next/Prev follow the sorted order:

```js
function playCurrentTrack(track) {
  if (player.queueSource !== "all") {
    player.clearQueue()
    player.queue = sortedTracks.value.map((t) => ({ ...t }))
    player.queueSource = "all"
  }

  const index = player.queue.findIndex((t) => t.file_path === track.file_path)
  if (index !== -1) {
    player.currentIndex = index
    player.setTrack(player.queue[index], false)
  } else {
    player.setTrack(track)
  }
}
```

- [ ] **Step 3: Add the controls and pass `sortedTracks` to both views**

Find this template block:

```vue
    <!-- List View -->
    <TrackList
      v-if="viewMode === 'list'"
      :tracks="tracks"
      :currentTrack="player.currentTrack"
      :formatDuration="formatDuration"
      :playlists="playlists"
      :currentPlaylistId="null"
      @select="playCurrentTrack"
      @add-to-playlist="handleAddToPlaylist"
    />

    <!-- Grid View -->
    <TrackGrid
      v-else
      :tracks="tracks"
      :currentTrack="player.currentTrack"
      @select="playCurrentTrack"
    />
```

Replace with:

```vue
    <TrackSortControls
      v-model:sortField="sortField"
      v-model:sortDirection="sortDirection"
    />

    <!-- List View -->
    <TrackList
      v-if="viewMode === 'list'"
      :tracks="sortedTracks"
      :currentTrack="player.currentTrack"
      :formatDuration="formatDuration"
      :playlists="playlists"
      :currentPlaylistId="null"
      @select="playCurrentTrack"
      @add-to-playlist="handleAddToPlaylist"
    />

    <!-- Grid View -->
    <TrackGrid
      v-else
      :tracks="sortedTracks"
      :currentTrack="player.currentTrack"
      @select="playCurrentTrack"
    />
```

- [ ] **Step 4: Manual verification**

Run: `cd /home/crimson/Documents/VS-CODE-WORKSPACE/EchoVault && npm run start`

In the running app:
1. Go to All Songs. Confirm the two sort pills render above the track list, right-aligned, both reading "Default"/"Ascending" initially (direction pill dimmed).
2. Click the field pill, choose "Artist" — confirm rows reorder alphabetically by artist and the direction pill becomes interactive.
3. Click the direction pill, choose "Descending" — confirm reverse order.
4. Click a track partway down the sorted list, then click Next in the player bar — confirm it advances to the next track in the *sorted* list, not the original order.
5. Switch to Grid view (top-right toggle) — confirm grid order matches the same sort.
6. Quit and relaunch the app (`npm run start` again) — confirm All Songs reopens with Artist/Descending still selected (persisted).

Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/components/AllSongs.vue
git commit -m "feat: wire track sorting into All Songs view"
```

---

### Task 4: Wire sorting into `Playlists.vue`

**Files:**
- Modify: `src/frontend/components/Playlists.vue`

**Interfaces:**
- Consumes: `useTrackSort` from Task 1, `TrackSortControls` from Task 2.
- Produces: nothing consumed elsewhere — leaf wiring task.

- [ ] **Step 1: Add the import and composable call**

Find this block in `<script setup>` (already present from the prior UI redesign work in this session):

```js
import { Play, Shuffle } from "@lucide/vue"
import { usePlayerStore } from "../store/player.js"
import { usePlaylistsStore } from "../store/playlists.js"
import TrackList from "./TrackList.vue"
import { useI18n } from "vue-i18n"
```

Replace with:

```js
import { Play, Shuffle } from "@lucide/vue"
import { usePlayerStore } from "../store/player.js"
import { usePlaylistsStore } from "../store/playlists.js"
import TrackList from "./TrackList.vue"
import TrackSortControls from "./TrackSortControls.vue"
import { useTrackSort } from "../utils/useTrackSort.js"
import { useI18n } from "vue-i18n"
```

Then find the `currentTracks` computed:

```js
const currentTracks = computed(() => {
  if (selectedPlaylist.value === "liked") {
    return likedTracks.value
  }
  return playlistTracks.value[selectedPlaylist.value] || []
})
```

Immediately after it, add:

```js
const { sortField, sortDirection, sortedTracks } = useTrackSort(
  currentTracks,
  "echovault-sort-playlist"
)
```

- [ ] **Step 2: Use `sortedTracks` in `playTrack`, `playFromStart`, `shuffleAndPlay`**

Find:

```js
function playTrack(track) {
  const queueSource =
    selectedPlaylist.value === "liked"
      ? "liked"
      : `playlist-${selectedPlaylist.value}`

  if (player.queueSource !== queueSource) {
    player.clearQueue()
    player.queue = currentTracks.value.map((t) => ({ ...t }))
    player.queueSource = queueSource
  }

  const index = player.queue.findIndex((t) => t.file_path === track.file_path)
  if (index !== -1) {
    player.currentIndex = index
    player.setTrack(player.queue[index], false)
  } else {
    player.setTrack(track)
  }
}

function playFromStart() {
  if (currentTracks.value.length) playTrack(currentTracks.value[0])
}

function shuffleAndPlay() {
  if (!currentTracks.value.length) return
  if (!player.shuffleEnabled) player.toggleShuffle()
  const randomIndex = Math.floor(Math.random() * currentTracks.value.length)
  playTrack(currentTracks.value[randomIndex])
}
```

Replace with:

```js
function playTrack(track) {
  const queueSource =
    selectedPlaylist.value === "liked"
      ? "liked"
      : `playlist-${selectedPlaylist.value}`

  if (player.queueSource !== queueSource) {
    player.clearQueue()
    player.queue = sortedTracks.value.map((t) => ({ ...t }))
    player.queueSource = queueSource
  }

  const index = player.queue.findIndex((t) => t.file_path === track.file_path)
  if (index !== -1) {
    player.currentIndex = index
    player.setTrack(player.queue[index], false)
  } else {
    player.setTrack(track)
  }
}

function playFromStart() {
  if (sortedTracks.value.length) playTrack(sortedTracks.value[0])
}

function shuffleAndPlay() {
  if (!sortedTracks.value.length) return
  if (!player.shuffleEnabled) player.toggleShuffle()
  const randomIndex = Math.floor(Math.random() * sortedTracks.value.length)
  playTrack(sortedTracks.value[randomIndex])
}
```

- [ ] **Step 3: Add the controls and pass `sortedTracks` to `TrackList`**

Find this template block:

```vue
      <div class="playlist-tracks">
        <TrackList
          :tracks="currentTracks"
          :currentTrack="player.currentTrack"
          :formatDuration="formatDuration"
          :playlists="playlists"
          :currentPlaylistId="
            selectedPlaylist !== 'liked' ? selectedPlaylist : null
          "
          @select="playTrack"
          @add-to-playlist="handleAddToPlaylist"
          @remove-from-playlist="handleRemoveFromPlaylist"
        />
      </div>
```

Replace with:

```vue
      <div class="playlist-tracks">
        <TrackSortControls
          v-model:sortField="sortField"
          v-model:sortDirection="sortDirection"
        />
        <TrackList
          :tracks="sortedTracks"
          :currentTrack="player.currentTrack"
          :formatDuration="formatDuration"
          :playlists="playlists"
          :currentPlaylistId="
            selectedPlaylist !== 'liked' ? selectedPlaylist : null
          "
          @select="playTrack"
          @add-to-playlist="handleAddToPlaylist"
          @remove-from-playlist="handleRemoveFromPlaylist"
        />
      </div>
```

- [ ] **Step 4: Manual verification**

Run: `cd /home/crimson/Documents/VS-CODE-WORKSPACE/EchoVault && npm run start`

In the running app:
1. Open a playlist with several tracks (or Liked Songs). Confirm the sort pills render above the track table.
2. Sort by Duration, Descending — confirm rows reorder longest-first.
3. Click the hero "Shuffle" button repeatedly — confirm it always plays a track from the currently sorted list (no errors, no track outside the playlist).
4. Click the hero "Play" button — confirm it starts the first track of the *sorted* order, not the original playlist order.
5. Navigate to a different playlist — confirm the same sort field/direction preference carries over (shared `echovault-sort-playlist` key), while All Songs' sort preference (Task 3) remains independent.

Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/components/Playlists.vue
git commit -m "feat: wire track sorting into playlist detail view"
```

---

### Task 5: i18n keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/ja.json`

**Interfaces:**
- Consumes: nothing.
- Produces: `sort.default`, `sort.name`, `sort.artist`, `sort.album`, `sort.duration`, `sort.ascending`, `sort.descending` keys, consumed by `TrackSortControls.vue` (Task 2) via `t(\`sort.${field}\`)`.

- [ ] **Step 1: Add the keys to `en.json`**

Find this block (added in the prior UI redesign session, near the top of the file):

```json
  "nav": {
    "home": "Home",
    "allSongs": "All Songs",
    "artists": "Artists",
    "library": "Library Info",
    "playlists": "Playlists",
    "section": {
      "app": "EchoVault",
      "library": "Library",
      "playlists": "Playlists"
    }
  },
```

Immediately after the closing `},` of that block, insert:

```json

  "sort": {
    "default": "Default",
    "name": "Name",
    "artist": "Artist",
    "album": "Album",
    "duration": "Duration",
    "ascending": "Ascending",
    "descending": "Descending"
  },
```

- [ ] **Step 2: Add the keys to `ja.json`**

Find the equivalent block in `ja.json`:

```json
  "nav": {
    "home": "ホーム",
    "allSongs": "すべての曲",
    "artists": "アーティスト",
    "library": "ライブラリ情報",
    "playlists": "プレイリスト",
    "section": {
      "app": "EchoVault",
      "library": "ライブラリ",
      "playlists": "プレイリスト"
    }
  },
```

Immediately after it, insert:

```json

  "sort": {
    "default": "デフォルト",
    "name": "名前",
    "artist": "アーティスト",
    "album": "アルバム",
    "duration": "再生時間",
    "ascending": "昇順",
    "descending": "降順"
  },
```

- [ ] **Step 3: Verify both files are valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('/home/crimson/Documents/VS-CODE-WORKSPACE/EchoVault/src/locales/en.json')); JSON.parse(require('fs').readFileSync('/home/crimson/Documents/VS-CODE-WORKSPACE/EchoVault/src/locales/ja.json')); console.log('both files valid JSON')"`

Expected output: `both files valid JSON`

- [ ] **Step 4: Manual verification in-app**

With `npm run start` running, open Settings → Language & Region, switch to Japanese, go to All Songs, open the sort field dropdown — confirm all seven labels are Japanese text, not raw `sort.xxx` keys or English fallback.

- [ ] **Step 5: Commit**

```bash
git add src/locales/en.json src/locales/ja.json
git commit -m "feat: add i18n keys for track sorting"
```
