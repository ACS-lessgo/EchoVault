<template>
  <div class="home-page">
    <div class="hero-card">
      <div class="hero-text">
        <h1>
          {{ t("home.welcome") }}<span class="highlight"> EchoVault</span>
        </h1>
      </div>
      <div class="wave">
        <div class="bar" v-for="n in 10" :key="n"></div>
      </div>
    </div>

    <div class="content-card">
      <div class="add-section">
        <h2>{{ t("home.import.heading") }}</h2>
        <div class="button-group">
          <button class="accent-btn" @click="addFolder">
            <i class="fas fa-folder-plus btn-icon"></i>
            {{ t("home.import.addFolder") }}
          </button>
        </div>
      </div>

      <div class="stats-section" v-if="folders.length > 0">
        <div class="stat-card">
          <div class="folder-card-icon"><i class="fas fa-folder"></i></div>
          <div class="stat-content">
            <div class="stat-value">{{ folders.length }}</div>
            <div class="stat-label">Folders</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="folder-card-icon"><i class="fas fa-music"></i></div>
          <div class="stat-content">
            <div class="stat-value">{{ totalTracks }}</div>
            <div class="stat-label">Total Tracks</div>
          </div>
        </div>
      </div>

      <div class="table-section">
        <div class="section-header">
          <h2>{{ t("home.yourCollection") }}</h2>
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
        <div v-if="folders.length === 0" class="empty-state">
          <div class="empty-icon"><i class="fas fa-music"></i></div>
          <div class="empty-text">{{ t("home.emptyCollection") }}</div>
          <div class="empty-subtext">Add a folder to get started</div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            class="page-btn"
            @click="currentPage--"
            :disabled="currentPage === 1"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="page-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            class="page-btn"
            @click="currentPage++"
            :disabled="currentPage === totalPages"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
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

const totalTracks = computed(() => {
  return folders.value.reduce(
    (sum, folder) => sum + (folder.trackCount || 0),
    0
  )
})

const totalPages = computed(() => {
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
  console.log("Folders :", folders.value)
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
  console.log("Rescanned Folders :", folders.value)

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
/* Home page layout */
.home-page {
  color: var(--text-color);
  padding: 2rem;
  background-color: var(--content-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

/* Hero section container */
.hero-card {
  width: 85%;
  background: linear-gradient(
    135deg,
    var(--accent),
    var(--accent-hover),
    var(--hover-bg)
  );
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  animation: fadeIn 0.8s ease;
  color: var(--text-color);
  transition:
    background 0.4s ease,
    color 0.4s ease,
    box-shadow 0.4s ease;
}

/* Hero section variant for light theme */
:root[data-theme="light"] .hero-card {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* Hero text styles */
.hero-text h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
}

.hero-text .highlight {
  color: var(--accent-hover);
  text-shadow: 0 0 10px rgb(255, 255, 255);
  margin-right: 10px;
}

.hero-text p {
  margin-top: 0.5rem;
  color: var(--muted-text);
}

/* Animated wave visualization */
.wave {
  display: flex;
  align-items: flex-end;
  height: 50px;
  gap: 4px;
}

.bar {
  width: 6px;
  height: 20px;
  background: var(--text-color);
  border-radius: 3px;
  animation: waveAnim 1s ease-in-out infinite;
}

.bar:nth-child(odd) {
  animation-delay: 0.2s;
}

.bar:nth-child(even) {
  animation-delay: 0.4s;
}

/* Wave animation */
@keyframes waveAnim {
  0%,
  100% {
    height: 10px;
    opacity: 0.6;
  }
  50% {
    height: 45px;
    opacity: 1;
  }
}

/* Fade-in animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Content card wrapper */
.content-card {
  background-color: var(--side-nav-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  width: 85%;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.8s ease 0.2s backwards;
}

/* Section spacing */
.add-section,
.table-section,
.rescan-section,
.stats-section {
  margin-bottom: 2rem;
  text-align: center;
}

/* Stats Section */
.stats-section {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: var(--topbar-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 180px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  animation: slideUp 0.6s ease backwards;
}

.stat-card:nth-child(1) {
  animation-delay: 0.3s;
}

.stat-card:nth-child(2) {
  animation-delay: 0.4s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.stat-content {
  text-align: left;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--muted-text);
  margin-top: 0.25rem;
}

/* Section headers */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

h2 {
  color: var(--accent);
  margin: 0;
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

/* Button group layout */
.button-group {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

/* Accent button */
.accent-btn {
  background-color: var(--accent);
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  margin-top: 1rem;
}

.btn-icon {
  font-size: 1rem;
}

.accent-btn:hover {
  background-color: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Grid View */
.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.folder-card {
  background: var(--topbar-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  transition: all 0.3s ease;
  animation: fadeInScale 0.4s ease backwards;
  cursor: pointer;
}

.folder-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  border-color: var(--accent);
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
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
  /* border: 1px solid var(--text-color); */
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

/* List View */
.folder-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 10px;
  overflow: hidden;
  background-color: var(--topbar-bg);
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
  animation: fadeIn 0.4s ease backwards;
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

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  animation: fadeIn 0.6s ease;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
  color: var(--muted-text);
}

.empty-text {
  font-size: 1.2rem;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.empty-subtext {
  color: var(--muted-text);
  font-size: 0.95rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
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
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .home-page {
    padding: 1rem;
  }

  .hero-card,
  .content-card {
    width: 95%;
  }

  .folder-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.25rem;
    width: 100%;
  }

  .stats-section {
    flex-direction: column;
    gap: 1rem;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
