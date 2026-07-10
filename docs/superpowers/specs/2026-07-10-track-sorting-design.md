# Track sorting for All Songs and Playlist views

## Context

User wants a sort control for the track list, modeled on a reference screenshot (Apple Music): two pill dropdowns above the track table — one picks the sort field, one picks direction (Ascending/Descending). Requested for "songs" (All Songs page); scoped up during design to also cover the playlist detail view, since both share `TrackList.vue` and users would expect the same control in both places.

The `tracks` table (`schema.sql`) only has `title`, `artist`, `album`, `duration` — no `genre`, no release date, no track number. The reference screenshot's Genre/Release Date/Track Number options have no backing data and are **omitted**, not faked. The reference's lock icon is an Apple Music "playlist locked from reordering" concept with no equivalent feature here — also omitted.

Neither `AllSongs.vue` nor `TrackList.vue` has any existing sort logic today; tracks render in whatever order `getTracks()`/`getPlaylistTracks()` return.

## Design

### 1. `src/frontend/composables/useTrackSort.js` (new)

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

`tracksRef` accepts any ref/computed with `.value` — both call sites pass an existing ref (`AllSongs.vue`'s `tracks`) or computed (`Playlists.vue`'s `currentTracks`). `sortedTracks` returns the original array reference unchanged when field is `default`, so no needless re-render when sorting is off.

### 2. `src/frontend/components/TrackSortControls.vue` (new)

Two pill-button dropdowns, styled consistent with the existing dropdown-menu convention already in `TrackList.vue` (`var(--radius-md)`, `var(--shadow-lg)`, `var(--side-nav-bg)` background) — duplicated locally in this component's scoped styles since Vue scoped CSS doesn't share across components without `:deep()`, matching how `TrackList.vue` already owns its own dropdown styling rather than a shared class.

Props: `sortField: String`, `sortDirection: String`. Emits: `update:sortField`, `update:sortDirection` (used via `v-model:sortField` / `v-model:sortDirection` at call sites).

Field dropdown lists `SORT_FIELDS` from the composable, labels via i18n (`sort.default`, `sort.name`, `sort.artist`, `sort.album`, `sort.duration`). Direction dropdown lists `asc`/`desc` (`sort.ascending`/`sort.descending`) and is rendered `disabled` (dimmed, `pointer-events: none`) when `sortField === "default"`, since direction has no meaning for the unsorted/default order.

No lock icon (see Context).

### 3. Wiring into `AllSongs.vue`

```js
import { useTrackSort } from "../composables/useTrackSort.js"
import TrackSortControls from "./TrackSortControls.vue"

const { sortField, sortDirection, sortedTracks } = useTrackSort(tracks, "echovault-sort-all-songs")
```

Template: add `<TrackSortControls v-model:sortField="sortField" v-model:sortDirection="sortDirection" />` as a new row between `.header` and the `<TrackList>`/`<TrackGrid>` block. Both `<TrackList :tracks="sortedTracks" ...>` and `<TrackGrid :tracks="sortedTracks" ...>` receive the sorted array (not raw `tracks`), so grid view stays consistent with the chosen sort when toggled.

`playCurrentTrack`'s queue-building (`player.queue = tracks.value.map((t) => ({ ...t }))`) changes to `player.queue = sortedTracks.value.map((t) => ({ ...t }))` — this is the piece that keeps Next/Prev navigation matching the order actually on screen. Without this change, sorting would only be a visual reorder while playback order silently stayed in DB-insertion order.

### 4. Wiring into `Playlists.vue`

```js
const { sortField, sortDirection, sortedTracks } = useTrackSort(currentTracks, "echovault-sort-playlist")
```

One shared key across all playlists/liked-songs (not per-playlist-id) — the sort *preference* is a per-screen-type setting, re-applied fresh to whichever playlist's tracks are currently loaded, avoiding unbounded localStorage keys as playlists are created/deleted.

Template: `<TrackList :tracks="sortedTracks" ...>` (replacing the current `:tracks="currentTracks"` binding), with `<TrackSortControls>` inserted in `.playlist-tracks` above `<TrackList>`.

`playTrack`, `playFromStart`, and `shuffleAndPlay` (the hero Play/Shuffle buttons added in the prior UI pass) all currently read from `currentTracks.value` when building `player.queue` / picking a track — all three switch to `sortedTracks.value` so Play/Shuffle/click-to-play/Next/Prev are consistent with the sorted order shown.

### 5. i18n

New `sort` block in both `en.json`/`ja.json`:
```json
"sort": {
  "default": "Default",
  "name": "Name",
  "artist": "Artist",
  "album": "Album",
  "duration": "Duration",
  "ascending": "Ascending",
  "descending": "Descending"
}
```

## Risks / edge cases

1. **Empty tracks array**: `sortedTracks` computed handles this trivially (`[...[]].sort()` is a no-op), no special-casing needed.
2. **Duration ties / missing values**: `?? 0` fallback avoids `NaN` comparisons for tracks with no duration metadata.
3. **Sorting while a track is playing**: sort only reorders the *displayed list* and the *queue built on next play action*; it does not interrupt or reorder the currently-playing track's position mid-playback (queue rebuild only happens inside `playCurrentTrack`/`playTrack`, triggered by a click, not by the sort-change watcher itself) — no unexpected skip when the user changes sort while listening.
4. **`sortField === "default"` direction dropdown disabled**: purely a UI affordance; the composable would no-op a direction change under `default` regardless, so disabling isn't strictly required for correctness, just clarity.

## Verification

1. `npm run start` — on All Songs: change field to Artist, confirm rows reorder alphabetically by artist; toggle direction, confirm reverse order; click a track, hit Next, confirm it advances through the *sorted* order, not the original DB order.
2. Switch to Grid view with a non-default sort active — confirm grid order matches the list order that was active.
3. Open a playlist, sort by Duration descending, use the hero Shuffle button — confirm queue is built from tracks in the sorted array (verify by checking `player.queue` order isn't the pre-sort insertion order for a non-shuffled Play-from-start case).
4. Restart the app — confirm All Songs and Playlist sort preferences persisted (two independent localStorage keys).
5. Toggle to `ja` locale — confirm sort dropdown labels are translated, no missing-key fallback.
