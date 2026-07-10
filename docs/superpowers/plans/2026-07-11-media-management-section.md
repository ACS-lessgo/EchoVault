# Media Management Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the folder add/remove/rescan UI out of the Library stats page (`LibraryInfo.vue`) into its own page and sidebar section, so the stats page never again hosts a variable-length, user-editable list.

**Architecture:** New route `/media` + new component `MediaManagement.vue` receives the folder-management template, script state, and CSS verbatim from `LibraryInfo.vue`. `LibraryInfo.vue` loses that block entirely and keeps only its stats/top-lists content. New sidebar link added under the existing "Library" nav group.

**Tech Stack:** Vue 3 `<script setup>`, vue-router, vue-i18n, `@lucide/vue` icons. No test framework in this repo (per `CLAUDE.md`) — verification is manual, by running `npm run start` and exercising the UI.

## Global Constraints

- ESM throughout `src/` (per `CLAUDE.md`).
- User-facing strings go through vue-i18n — every new key added to both `src/locales/en.json` and `src/locales/ja.json`.
- No `console.log` in new code; existing `console.warn`/`console.error` in moved code is untouched (matches existing convention in this file).

---

### Task 1: Add i18n keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/ja.json`

**Interfaces:**
- Produces: `nav.media` (sidebar label), `media.title` (page heading) — consumed by Task 3 (`SideNav.vue`) and Task 2 (`MediaManagement.vue`).

- [ ] **Step 1: Add `nav.media` to `en.json`**

Find the `"nav"` block (around line 64-75):
```json
  "nav": {
    "home": "Home",
    "allSongs": "All Songs",
    "artists": "Artists",
    "library": "Library",
    "playlists": "Playlists",
```
Change to:
```json
  "nav": {
    "home": "Home",
    "allSongs": "All Songs",
    "artists": "Artists",
    "library": "Library",
    "media": "Media Management",
    "playlists": "Playlists",
```

- [ ] **Step 2: Add `media.title` to `en.json`**

Find the `"library"` block (around line 36-38):
```json
  "library": {
    "folderManagement": "Manage Folders"
  },
```
Change to:
```json
  "library": {
    "folderManagement": "Manage Folders"
  },

  "media": {
    "title": "Media Management"
  },
```

- [ ] **Step 3: Mirror both keys in `ja.json`**

Apply the same two additions to `src/locales/ja.json`, in the same relative positions (find its `"nav"` block and its `"library"` block). Use these Japanese strings:
- `nav.media`: `"メディア管理"`
- `media.title`: `"メディア管理"`

- [ ] **Step 4: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/locales/en.json'))" && node -e "JSON.parse(require('fs').readFileSync('src/locales/ja.json'))" && echo OK`
Expected: `OK` printed, no parse errors.

- [ ] **Step 5: Commit**

```bash
git add src/locales/en.json src/locales/ja.json
git commit -m "i18n: add nav.media and media.title keys for Media Management page"
```

---

### Task 2: Create MediaManagement.vue

**Files:**
- Create: `src/frontend/components/MediaManagement.vue`

**Interfaces:**
- Consumes: `window.api.getFolders()`, `window.api.addFolder()`, `window.api.removeFolder(path)`, `window.api.rescanLibrary()` (all already exist in `src/preload.js`, unchanged — same calls `LibraryInfo.vue` currently makes).
- Produces: default-exported Vue component, no props, no emits — mounted directly by the router (Task 4).

- [ ] **Step 1: Write the file**

```vue
<template>
  <div class="media-container">
    <h1 class="media-title">{{ t("media.title") }}</h1>

    <div class="folder-management-section">
      <div class="section-header">
        <h2 class="section-title">{{ t("library.folderManagement") }}</h2>
        <div class="folder-header-actions">
          <button class="accent-btn" @click="addFolder">
            <i class="fas fa-folder-plus btn-icon"></i>
            {{ t("home.import.addFolder") }}
          </button>
          <div class="view-controls" v-if="folders.length > 0">
            <button
              :class="['view-btn', { active: viewMode === 'grid' }]"
              @click="viewMode = 'grid'"
              title="Grid view"
            >
              <i class="fas fa-th"></i>
            </button>
            <button
              :class="['view-btn', { active: viewMode === 'list' }]"
              @click="viewMode = 'list'"
              title="List view"
            >
              <i class="fas fa-list"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Grid View -->
      <div
        v-if="viewMode === 'grid' && folders.length > 0"
        class="folder-grid"
      >
        <div
          v-for="folder in paginatedFolders"
          :key="folder.id"
          class="folder-card"
        >
          <div class="folder-card-icon"><i class="fas fa-folder"></i></div>
          <div class="folder-card-content">
            <div class="folder-card-path" :title="folder.path">
              {{ getFolderName(folder.path) }}
            </div>
            <div class="folder-card-full-path">{{ folder.path }}</div>
            <div class="folder-card-tracks">
              {{ folder.trackCount || 0 }} tracks
            </div>
          </div>
          <button
            class="folder-card-remove"
            @click="removeFolder(folder.path)"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- List View -->
      <table
        v-if="viewMode === 'list' && folders.length > 0"
        class="folder-table"
      >
        <thead>
          <tr>
            <th>{{ t("table.folderPath") }}</th>
            <th style="width: 120px; text-align: center">Tracks</th>
            <th style="width: 50px"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="folder in paginatedFolders"
            :key="folder.id"
            class="folder-row"
          >
            <td>
              <div class="folder-info">
                <span class="folder-icon"><i class="fas fa-folder"></i></span>
                <div>
                  <div class="folder-path">{{ folder.path }}</div>
                  <div class="folder-name">
                    {{ getFolderName(folder.path) }}
                  </div>
                </div>
              </div>
            </td>
            <td style="text-align: center">
              <span class="track-badge">{{ folder.trackCount || 0 }}</span>
            </td>
            <td class="remove-cell">
              <button
                class="icon-btn"
                @click="removeFolder(folder.path)"
                title="Remove folder"
              >
                <i class="fas fa-minus"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="folders.length === 0" class="folder-empty-state">
        <div class="empty-icon"><i class="fas fa-music"></i></div>
        <div class="empty-text">{{ t("home.emptyCollection") }}</div>
        <div class="empty-subtext">Add a folder to get started</div>
      </div>

      <!-- Pagination -->
      <div v-if="totalFolderPages > 1" class="pagination">
        <button
          class="page-btn"
          @click="currentPage--"
          :disabled="currentPage === 1"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-info">
          Page {{ currentPage }} of {{ totalFolderPages }}
        </span>
        <button
          class="page-btn"
          @click="currentPage++"
          :disabled="currentPage === totalFolderPages"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <div class="rescan-section" v-if="folders.length > 0">
        <button
          class="rescan-btn"
          @click="rescanLibrary"
          :disabled="isRescanning"
        >
          <span v-if="!isRescanning"
            ><i class="fas fa-sync-alt"></i> {{ t("home.rescan") }}</span
          >
          <span v-else class="scanning">
            <span class="spinner"></span> Scanning...
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useI18n } from "vue-i18n"

const { t } = useI18n()

const folders = ref([])
const viewMode = ref("grid")
const currentPage = ref(1)
const itemsPerPage = ref(12)
const isRescanning = ref(false)

const totalFolderPages = computed(() => {
  return Math.ceil(folders.value.length / itemsPerPage.value)
})

const paginatedFolders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return folders.value.slice(start, end)
})

function getFolderName(path) {
  return path.split(/[/\\]/).pop() || path
}

async function loadFolders() {
  folders.value = await window.api.getFolders()
}

async function addFolder() {
  folders.value = await window.api.addFolder()
  currentPage.value = 1
}

async function removeFolder(path) {
  folders.value = await window.api.removeFolder(path)
  if (paginatedFolders.value.length === 0 && currentPage.value > 1) {
    currentPage.value--
  }
}

async function rescanLibrary() {
  isRescanning.value = true
  folders.value = await window.api.rescanLibrary()

  setTimeout(() => {
    isRescanning.value = false
    alert("Library rescanned successfully!")
  }, 500)
}

onMounted(() => {
  loadFolders()
})
</script>

<style scoped>
.media-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeIn 0.6s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.media-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 2rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1.5rem;
}

/* Folder management section */
.folder-management-section {
  animation: fadeIn 0.8s ease 0.1s both;
}

.folder-management-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.folder-header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.accent-btn {
  background-color: var(--accent);
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.accent-btn:hover {
  background-color: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-icon {
  font-size: 1rem;
}

/* View Controls */
.view-controls {
  display: flex;
  gap: 0.5rem;
}

.view-btn {
  background: var(--topbar-bg);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background: var(--hover-bg);
}

.view-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

/* Folder grid view */
.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin: 1rem 0 2rem;
}

.folder-card {
  background: var(--topbar-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
}

.folder-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  border-color: var(--accent);
}

.folder-card-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  text-align: center;
  opacity: 0.8;
  color: var(--accent);
}

.folder-card-content {
  text-align: center;
  overflow: hidden;
}

.folder-card-path {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-card-full-path {
  display: inline-block;
  white-space: nowrap;
  font-size: 0.75rem;
  color: var(--muted-text);
  cursor: default;
  transition: transform 0.3s ease;
  margin-bottom: 0.75rem;
}

.folder-card-full-path:hover {
  animation: scrollText 6s linear infinite;
}

@keyframes scrollText {
  0%,
  10% {
    transform: translateX(0);
  }
  90%,
  100% {
    transform: translateX(-60%);
  }
}

.folder-card-tracks {
  color: var(--accent);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  width: fit-content;
  margin: 0 auto;
}

.folder-card-remove {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.4);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
}

.folder-card:hover .folder-card-remove {
  opacity: 1;
}

.folder-card-remove:hover {
  background: var(--accent);
  transform: scale(1.1);
}

/* Folder list view */
.folder-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 10px;
  overflow: hidden;
  background-color: var(--topbar-bg);
  margin-bottom: 2rem;
}

.folder-table th,
.folder-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  text-align: left;
}

.folder-table th {
  background: var(--hover-bg);
  font-weight: 600;
  color: var(--accent);
}

.folder-row {
  transition: background 0.2s ease;
}

.folder-row:hover {
  background: var(--hover-bg);
}

.folder-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.folder-icon {
  font-size: 1.25rem;
  color: var(--accent);
}

.folder-path {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.95rem;
}

.folder-name {
  font-size: 0.8rem;
  color: var(--muted-text);
  margin-top: 2px;
}

.track-badge {
  background: var(--accent);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-block;
}

.remove-cell {
  text-align: center;
  width: 50px;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 4px;
}

.icon-btn:hover {
  color: var(--accent-hover);
  transform: scale(1.2) rotate(90deg);
}

/* Folder-management empty state */
.folder-empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.folder-empty-state .empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
  color: var(--muted-text);
}

.folder-empty-state .empty-text {
  font-size: 1.2rem;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.folder-empty-state .empty-subtext {
  color: var(--muted-text);
  font-size: 0.95rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  margin-bottom: 2rem;
}

.page-btn {
  background: var(--topbar-bg);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover:not(:disabled) {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-color);
  font-size: 0.95rem;
}

/* Rescan button */
.rescan-section {
  text-align: center;
}

.rescan-btn {
  background-color: var(--topbar-bg);
  border: 1px solid var(--accent);
  color: var(--text-color);
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.rescan-btn:hover:not(:disabled) {
  background-color: var(--accent);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.rescan-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.scanning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .media-container {
    padding: 1rem;
  }

  .media-title {
    font-size: 2rem;
  }

  .folder-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.25rem;
  }

  .folder-management-section .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/frontend/components/MediaManagement.vue
git commit -m "feat: add MediaManagement.vue with folder add/remove/rescan UI"
```

---

### Task 3: Remove folder-management content from LibraryInfo.vue

**Files:**
- Modify: `src/frontend/components/LibraryInfo.vue`

**Interfaces:**
- Consumes: nothing new.
- Produces: `LibraryInfo.vue` no longer defines `folders`, `viewMode`, `currentPage`, `itemsPerPage`, `isRescanning`, `totalFolderPages`, `paginatedFolders`, `getFolderName`, `loadFolders`, `addFolder`, `removeFolder`, `rescanLibrary` — any later task must not reference these names on this component.

- [ ] **Step 1: Remove the folder-management template block**

Find (between the `info-section`'s closing `</div>` and the `<!-- Most Played Songs -->` comment):
```
    </div>

    <!-- Folder Management -->
    <div class="folder-management-section">
      <div class="section-header">
        <h2 class="section-title">{{ t("library.folderManagement") }}</h2>
```
... (full block, ending with) ...
```
      <div class="rescan-section" v-if="folders.length > 0">
        <button
          class="rescan-btn"
          @click="rescanLibrary"
          :disabled="isRescanning"
        >
          <span v-if="!isRescanning"
            ><i class="fas fa-sync-alt"></i> {{ t("home.rescan") }}</span
          >
          <span v-else class="scanning">
            <span class="spinner"></span> Scanning...
          </span>
        </button>
      </div>
    </div>

    <!-- Most Played Songs -->
```

Replace the entire block (from `<!-- Folder Management -->` through the `</div>` that immediately precedes `<!-- Most Played Songs -->`) with nothing, so the `info-section`'s closing `</div>` is followed directly by `<!-- Most Played Songs -->`:
```
    </div>

    <!-- Most Played Songs -->
```

- [ ] **Step 2: Remove folder-related refs from script**

Find:
```js
const loading = ref(true)
const initialLoading = ref(true)
const folders = ref([])
const viewMode = ref("grid")
const currentPage = ref(1)
const itemsPerPage = ref(12)
const isRescanning = ref(false)
const animatedTracks = ref(0)
```
Replace with:
```js
const loading = ref(true)
const initialLoading = ref(true)
const animatedTracks = ref(0)
```

- [ ] **Step 3: Simplify onMounted (drop loadFolders)**

Find:
```js
onMounted(async () => {
  await Promise.all([loadStats(), loadFolders()])
  initialLoading.value = false
})
```
Replace with:
```js
onMounted(async () => {
  await loadStats()
  initialLoading.value = false
})
```

- [ ] **Step 4: Remove folder-related computeds and functions**

Find:
```js
const totalFolderPages = computed(() => {
  return Math.ceil(folders.value.length / itemsPerPage.value)
})

const paginatedFolders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return folders.value.slice(start, end)
})

function getFolderName(path) {
  return path.split(/[/\\]/).pop() || path
}

async function loadFolders() {
  folders.value = await window.api.getFolders()
}

async function addFolder() {
  folders.value = await window.api.addFolder()
  currentPage.value = 1
  await loadStats()
}

async function removeFolder(path) {
  folders.value = await window.api.removeFolder(path)
  if (paginatedFolders.value.length === 0 && currentPage.value > 1) {
    currentPage.value--
  }
  await loadStats()
}

async function rescanLibrary() {
  isRescanning.value = true
  folders.value = await window.api.rescanLibrary()
  await loadStats()

  setTimeout(() => {
    isRescanning.value = false
    alert("Library rescanned successfully!")
  }, 500)
}

onMounted(async () => {
```
Replace with:
```js
onMounted(async () => {
```
(This deletes the five computeds/functions and leaves the `onMounted` from Step 3 as the next statement.)

- [ ] **Step 5: Drop now-unused `computed` import if nothing else in the file uses it**

Run: `grep -n "computed(" src/frontend/components/LibraryInfo.vue`
Expected: no matches (both computed usages were folder-related and removed in Step 4).

If no matches, find:
```js
import { ref, onMounted, computed } from "vue"
```
Replace with:
```js
import { ref, onMounted } from "vue"
```

- [ ] **Step 6: Remove folder-management CSS block**

Find the CSS block starting at `/* Folder management section */` and ending at the file's final `</style>` closing tag — i.e. everything from:
```css
/* Folder management section */
.folder-management-section {
```
through the end of the file:
```css
@media (max-width: 768px) {
  .folder-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.25rem;
  }

  .folder-management-section .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
```

Replace with just:
```css
</style>
```

- [ ] **Step 7: Sanity check the file is still readable**

Run: `node -e "require('fs').readFileSync('src/frontend/components/LibraryInfo.vue','utf8')" && echo "file readable"`
Expected: `file readable` (real verification of correctness happens in Task 5, by actually running the app).

- [ ] **Step 8: Commit**

```bash
git add src/frontend/components/LibraryInfo.vue
git commit -m "refactor: remove folder-management UI from LibraryInfo.vue (moved to MediaManagement.vue)"
```

---

### Task 4: Wire up route and sidebar nav entry

**Files:**
- Modify: `src/frontend/router/index.js`
- Modify: `src/frontend/components/SideNav.vue`

**Interfaces:**
- Consumes: `MediaManagement.vue` (Task 2), `nav.media` i18n key (Task 1).
- Produces: route path `/media`, reachable from the sidebar.

- [ ] **Step 1: Register the route**

Find in `src/frontend/router/index.js`:
```js
  { path: "/library", component: LibraryInfo },
```
Replace with:
```js
  { path: "/library", component: LibraryInfo },
  { path: "/media", component: MediaManagement },
```

Then find the import block at the top of the file (look for `import LibraryInfo from`) and add the new import directly below it:
```js
import LibraryInfo from "../components/LibraryInfo.vue"
import MediaManagement from "../components/MediaManagement.vue"
```

- [ ] **Step 2: Add the sidebar link**

Find in `src/frontend/components/SideNav.vue`:
```html
        <nav v-show="sections.library">
          <router-link to="/library" class="nav-item">
            <Library class="nav-icon" :size="20" />
            <span>{{ t('nav.library') }}</span>
          </router-link>
        </nav>
```
Replace with:
```html
        <nav v-show="sections.library">
          <router-link to="/library" class="nav-item">
            <Library class="nav-icon" :size="20" />
            <span>{{ t('nav.library') }}</span>
          </router-link>

          <router-link to="/media" class="nav-item">
            <FolderCog class="nav-icon" :size="20" />
            <span>{{ t('nav.media') }}</span>
          </router-link>
        </nav>
```

- [ ] **Step 3: Import the `FolderCog` icon**

Find:
```js
import { Home, Music, User, Library, ListMusic, ChevronDown } from '@lucide/vue'
```
Replace with:
```js
import { Home, Music, User, Library, ListMusic, ChevronDown, FolderCog } from '@lucide/vue'
```

- [ ] **Step 4: Commit**

```bash
git add src/frontend/router/index.js src/frontend/components/SideNav.vue
git commit -m "feat: wire up /media route and sidebar entry for Media Management"
```

---

### Task 5: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the app**

Run: `npm run start`
Expected: app window opens, no errors in the terminal output (watch for Vue compile errors or missing-import errors from Tasks 1-4).

- [ ] **Step 2: Check the sidebar**

In the running app, confirm a new "Media Management" link appears in the sidebar's Library group, directly below "Library".

- [ ] **Step 3: Check the new page**

Click "Media Management". Confirm:
- Folder add/remove/grid-list-toggle/pagination/rescan UI renders (same as it did on the old Library page).
- No stats content (stat cards, top tracks/artists) appears on this page.

- [ ] **Step 4: Check the Library page is now stats-only**

Click "Library". Confirm:
- Stat cards, info cards, and top tracks/artists sections render.
- No folder add/remove UI appears anywhere on this page.
- No layout jitter on load, in both a normal window and a maximized window (the original bug this whole change traces back to).

- [ ] **Step 5: Exercise the folder actions on the new page**

On the Media Management page: add a folder, confirm it appears in the grid; toggle to list view, confirm the table renders; remove a folder, confirm it disappears; if 12+ folders exist, confirm pagination controls work; click Rescan, confirm the spinner shows then an alert confirms completion.

- [ ] **Step 6: Cross-check stats stay in sync**

After adding/removing a folder on the Media Management page, navigate to Library. Confirm the "Folders" stat card reflects the change (proves the decoupling in the design — Library refetches fresh on mount, no direct call needed from Media Management).

- [ ] **Step 7: Report results**

If all checks pass, report done. If anything fails, note exactly which step and what was observed — return to the relevant task above rather than patching ad hoc.
