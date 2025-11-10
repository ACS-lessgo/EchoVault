<template>
  <div class="home-page">
    <div class="hero-card">
      <div class="hero-text">
        <h1>Welcome to <span class="highlight">EchoVault</span></h1>
      </div>
      <div class="wave">
        <div class="bar" v-for="n in 10" :key="n"></div>
      </div>
    </div>

    <div class="content-card">
      <div class="add-section">
        <h2>Import Your Music</h2>
        <div class="button-group">
          <button class="accent-btn" @click="addFolder">Add Folder</button>
        </div>
      </div>

      <div class="table-section">
        <h2>Your Music Collection</h2>
        <table class="folder-table">
          <thead>
            <tr>
              <th>Folder Path</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="folder in folders" :key="folder.id">
              <td>
                <div class="folder-info">
                  <span class="folder-path">{{ folder.path }}</span>
                  <span class="track-count"
                    >{{ folder.trackCount || 0 }} tracks</span
                  >
                </div>
              </td>
              <td class="remove-cell">
                <button class="icon-btn" @click="removeFolder(folder.path)">
                  −
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="rescan-section">
        <button class="rescan-btn" @click="rescanLibrary">
          Rescan Library
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"

const folders = ref([])

async function loadFolders() {
  folders.value = await window.api.getFolders()
  console.log("Folders :", folders.value)
}

async function addFolder() {
  folders.value = await window.api.addFolder()
}

async function removeFolder(path) {
  folders.value = await window.api.removeFolder(path)
}

async function rescanLibrary() {
  folders.value = await window.api.rescanLibrary()
  console.log("Rescanned Folders :", folders.value)
  alert("Library rescanned successfully!")
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
}

/* Section spacing */
.add-section,
.table-section,
.rescan-section {
  margin-bottom: 2rem;
  text-align: center;
}

/* Section headers */
h2 {
  color: var(--accent);
  margin-bottom: 1rem;
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
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;
  overflow: hidden;
}

.accent-btn:hover {
  background-color: var(--accent-hover);
}

/* Accent button hover effect */
.accent-btn::after {
  content: "";
  position: absolute;
  left: -100%;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.15);
  transition: left 0.3s;
}

.accent-btn:hover::after {
  left: 0;
}

/* Folder table layout */
.folder-table {
  width: 80%;
  margin: 0 auto;
  border-collapse: collapse;
  border-radius: 10px;
  overflow: hidden;
  background-color: var(--topbar-bg);
}

.folder-table th,
.folder-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  text-align: left;
}

/* Remove folder button */
.remove-btn {
  background-color: transparent;
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.remove-btn:hover {
  background-color: var(--accent);
  color: white;
}

/* Rescan button */
.rescan-btn {
  background-color: var(--topbar-bg);
  border: 1px solid var(--accent);
  color: var(--text-color);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}

.rescan-btn:hover {
  background-color: var(--accent);
  color: white;
}

/* Folder info layout */
.folder-info {
  display: flex;
  flex-direction: column;
}

.folder-path {
  font-weight: 500;
}

.track-count {
  font-size: 0.85rem;
  color: #aaa;
}

/* Remove cell alignment */
.remove-cell {
  text-align: center;
  width: 50px;
}

/* Icon button styles */
.icon-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s ease;
}

.icon-btn:hover {
  color: var(--accent-hover);
  transform: scale(1.1);
}
</style>
