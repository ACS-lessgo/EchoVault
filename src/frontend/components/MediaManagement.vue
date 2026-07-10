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
