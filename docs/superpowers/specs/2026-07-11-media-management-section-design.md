# Media Management section

## Context

`LibraryInfo.vue` (the Library stats page) had a folder-add/-remove/rescan section bolted onto it. That section renders a variable-length grid/table with pagination and an empty state — content whose height depends on how many folders exist and which view mode is active. Combined with the page's async data loading, this produced a visible layout jitter on load (tracked and partially fixed as "library page loading jitter"). The fix narrowed the jitter but the underlying design problem remains: a stats page has no business hosting a variable-length, user-editable list. Moving folder management to its own section removes this entire class of risk permanently instead of continuing to patch symptoms on the stats page.

## Design

**New route and page**
- New route `/media` in `src/frontend/router/index.js`, pointing at a new component `src/frontend/components/MediaManagement.vue`.

**New sidebar entry**
- `SideNav.vue`: new `<router-link to="/media">` added inside the existing "Library" `nav-section`, directly below the current `/library` link. Icon: `FolderCog` from `@lucide/vue`. Label: new `nav.media` i18n key.

**Content moved from `LibraryInfo.vue` to `MediaManagement.vue`**
- Template: the add-folder button, grid/list view toggle, folder grid, folder table, empty state, pagination controls, and rescan button/section.
- Script: `folders`, `viewMode`, `currentPage`, `itemsPerPage`, `isRescanning` refs; `loadFolders`, `addFolder`, `removeFolder`, `rescanLibrary`, `getFolderName` functions; `paginatedFolders`, `totalFolderPages` computeds; `onMounted` calling `loadFolders()`.
- Scoped CSS: the folder-grid/folder-table/pagination/rescan styles currently in `LibraryInfo.vue`.

**Decoupling from Library stats**
- Today, `addFolder`/`removeFolder`/`rescanLibrary` each call `loadStats()` afterward so the stats page reflects the change immediately. `MediaManagement.vue` will not call `loadStats()` — it's a separate route with no access to `LibraryInfo.vue`'s internal state. Since `LibraryInfo.vue` re-fetches all its stats fresh on every mount (`onMounted`), navigating to Library after changing folders shows current data without needing a cross-page call. No shared state or event bus is introduced.

**What stays in `LibraryInfo.vue`**
- `stats-grid` (7 always-rendered cards, unconditional — this was never part of the jitter, stays exactly as-is).
- `info-section` and `top-lists-section`, still gated behind the existing `initialLoading` flag from the prior fix (unchanged).
- `stats.value.totalFolders` continues to come from `loadStats()`'s own `window.api.getFolders()` call — that's a stat count, not the management UI, and has no layout-shift risk (it's a single number in a fixed card).

**i18n**
- Add `nav.media` to `src/locales/en.json` and `src/locales/ja.json` (sidebar label).
- Add `media.title` to both locale files, used as `MediaManagement.vue`'s page `<h1>`.
- Reuse the existing `library.folderManagement` key as the in-page section heading (unchanged string, just relocated).

## Files touched

- `src/frontend/router/index.js` — add `/media` route
- `src/frontend/components/SideNav.vue` — add nav item
- `src/frontend/components/MediaManagement.vue` — new file, receives moved content
- `src/frontend/components/LibraryInfo.vue` — folder-management content removed
- `src/locales/en.json`, `src/locales/ja.json` — new keys

## Verification

Manual, in the running app (no automated test suite in this repo per CLAUDE.md):
1. Sidebar shows a new "Media Management" link under Library; navigating to it loads folder management with no stats-page content.
2. Add a folder, remove a folder, rescan — all work exactly as before, just on the new page.
3. Navigate Library → Media Management → Library: stats reflect any folder changes made in between (fresh fetch on remount).
4. Library page no longer contains any folder UI, and its layout is stable (no jitter) on load in both windowed and maximized states.
