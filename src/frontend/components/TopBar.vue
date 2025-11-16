<template>
  <header class="top-bar">
    <!-- Window controls row - sits at top -->
    <div class="window-controls">
      <button class="win-btn" @click="winMinimize">
        <img :src="Minimize" :style="iconFilter" />
      </button>

      <button class="win-btn" @click="winMaximize">
        <img :src="Maximize" :style="iconFilter" />
      </button>

      <button class="win-btn close-btn" @click="winClose">
        <img :src="X" :style="iconFilter" />
      </button>
    </div>

    <!-- Main content row - search and actions below controls -->
    <div class="main-content">
      <div class="search-bar">
        <img
          :src="Search"
          alt="Search"
          class="search-icon"
          :style="iconFilter"
        />
        <input
          v-model="localQuery"
          type="text"
          placeholder="Search..."
          class="search-input"
        />
      </div>

      <div class="actions">
        <!-- Theme Button -->
        <button title="Theme" @click="toggleTheme" class="icon-btn">
          <img
            class="topbar-icon-class"
            :src="isDarkMode ? Light : Dark"
            :style="iconFilter"
            alt="Theme"
          />
        </button>

        <!-- Settings Button -->
        <div class="settings-dropdown-wrapper">
          <button title="Settings" class="icon-btn" @click="toggleDropdown">
            <img
              class="topbar-icon-class"
              :src="Settings"
              :style="iconFilter"
              alt="Settings"
            />
          </button>

          <!-- Dropdown -->
          <transition name="dropdown-fade">
            <div v-if="showDropdown" class="settings-dropdown">
              <div class="dropdown-section">
                <div class="dropdown-title">Color Scheme</div>
                <div class="color-options">
                  <div
                    v-for="color in accentColors"
                    :key="color.name"
                    class="color-circle"
                    :class="{ active: activeAccent === color.value }"
                    :style="{ background: color.value }"
                    @click="setAccent(color.value)"
                  >
                    <i
                      v-if="activeAccent === color.value"
                      class="fa-solid fa-check"
                      style="color: white; font-size: 14px"
                    ></i>
                  </div>
                </div>
              </div>

              <!-- Future scope -->
              <div class="dropdown-section disabled">
                <div class="dropdown-title">Equalizer</div>
                <div class="dropdown-note">Coming soon...</div>
              </div>
              <div class="dropdown-section disabled">
                <div class="dropdown-title">Keyboard Shortcuts</div>
                <div class="dropdown-note">Coming soon...</div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, watch, onMounted, computed, onBeforeUnmount } from "vue"
import {
  Dark,
  Light,
  Settings,
  Search,
  Maximize,
  Minimize,
  X,
} from "../assets/icons/icons.js"
import { useSearchStore } from "../store/search.js"
import { debounce } from "../../backend/utils/debounce.js"

const isDarkMode = ref(true)
const showDropdown = ref(false)
const searchStore = useSearchStore()
const localQuery = ref(searchStore.query)
const accentColors = [
  { name: "Purple", value: "#8e44ad" },
  { name: "Blue", value: "#3498db" },
  { name: "Green", value: "#27ae60" },
  { name: "Orange", value: "#e67e22" },
  { name: "Pink", value: "#e84393" },
  { name: "Red", value: "#c0392b" },
  { name: "Teal", value: "#1abc9c" },
]
const activeAccent = ref(localStorage.getItem("accentColor") || "#8e44ad")
let isMax = ref(false)

const updateSearch = debounce((val) => {
  searchStore.setQuery(val.trim())
}, 400)

watch(localQuery, (val) => updateSearch(val))

// Theme toggling
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.setAttribute(
    "data-theme",
    isDarkMode.value ? "dark" : "light"
  )
}

if (localStorage.getItem("theme") === "light") {
  isDarkMode.value = false
  document.documentElement.setAttribute("data-theme", "light")
}

watch(isDarkMode, (val) => {
  localStorage.setItem("theme", val ? "dark" : "light")
})

// Dropdown toggle
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

// Accent color logic
const setAccent = (color) => {
  document.documentElement.style.setProperty("--accent", color)
  document.documentElement.style.setProperty(
    "--accent-hover",
    adjustBrightness(color, 1.15)
  )
  document.documentElement.style.setProperty(
    "--hover-bg",
    hexToRgba(color, 0.2)
  )
  localStorage.setItem("accentColor", color)
  activeAccent.value = color
  showDropdown.value = false
}

function hexToRgba(hex, alpha = 0.25) {
  const c = hex.replace("#", "")
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Load previous accent color
onMounted(() => {
  const savedColor = localStorage.getItem("accentColor")
  if (savedColor) setAccent(savedColor)
})

// Utility: brighten/darken color
function adjustBrightness(hex, factor) {
  const col = hex.replace("#", "")
  const r = parseInt(col.substring(0, 2), 16)
  const g = parseInt(col.substring(2, 4), 16)
  const b = parseInt(col.substring(4, 6), 16)
  const newR = Math.min(255, Math.floor(r * factor))
  const newG = Math.min(255, Math.floor(g * factor))
  const newB = Math.min(255, Math.floor(b * factor))
  return `rgb(${newR}, ${newG}, ${newB})`
}

const iconFilter = computed(() => ({
  filter: isDarkMode.value
    ? "invert(100%) brightness(200%)"
    : "invert(0%) brightness(0%)",
}))

const handleClickOutside = (e) => {
  const dropdown = document.querySelector(".settings-dropdown-wrapper")
  if (dropdown && !dropdown.contains(e.target)) {
    showDropdown.value = false
  }
}

const winMinimize = () => {
  window.api.minimize()
}

const winMaximize = async () => {
  isMax = await window.api.isMaximized()
  window.api.maximize()
}

const winClose = () => {
  window.api.close()
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside)
})
</script>

<style scoped>
/* Top bar – header layout with window controls on top, search and actions below */

/* Main container - flexible column layout */
.top-bar {
  background-color: var(--topbar-bg);
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  border-bottom: 2px solid var(--border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  -webkit-app-region: drag; /* make whole topbar draggable */
}

/* Window controls - positioned at top right like native apps */
.window-controls {
  display: flex;
  gap: 0;
  margin-left: auto;
  -webkit-app-region: no-drag;
  height: 32px;
}

.win-btn {
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  transition: background 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.win-btn img {
  width: 15px;
  height: 15px;
}

.win-btn:hover {
  background: var(--search-bar-color);
}

.close-btn:hover {
  background: #e81123 !important;
}

/* Main content row - contains search bar and action buttons */
.main-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem 0.75rem 1rem;
  -webkit-app-region: no-drag;
}

/* Search bar */
.search-bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background-color: var(--search-bar-color);
  color: var(--text-color);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  flex: 1;
  max-width: 500px;
}

.search-icon {
  width: 16px;
  height: 16px;
  filter: invert(100%) brightness(200%);
  margin-right: 0.5rem;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-color);
  font-size: 0.9rem;
}

.search-input::placeholder {
  color: var(--muted-text);
}

/* Action buttons group - positioned on the right */
.actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
}

/* Icon buttons */
.icon-btn {
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  justify-content: center;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
  -webkit-app-region: no-drag;
}

.icon-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.topbar-icon-class {
  width: 18px;
  height: 18px;
  filter: invert(100%) brightness(200%);
}

/* Settings dropdown container */
.settings-dropdown-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

/* Dropdown panel */
.settings-dropdown {
  position: absolute;
  top: 120%;
  right: 0;
  background: var(--side-nav-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1rem;
  min-width: 200px;
  z-index: 999;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  animation: fadeIn 0.2s ease;
}

/* Dropdown sections and titles */
.dropdown-section {
  margin-bottom: 1rem;
}

.dropdown-section.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dropdown-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--muted-text);
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

/* Color theme options */
.color-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-circle:hover {
  transform: scale(1.1);
  box-shadow: 0 0 6px var(--accent);
}

.color-circle.active {
  box-shadow:
    0 0 0 3px var(--border-color),
    0 0 0 5px var(--accent);
  transform: scale(1.1);
}

.color-circle svg {
  pointer-events: none;
}

/* Dropdown note text */
.dropdown-note {
  font-size: 0.85rem;
  color: var(--muted-text);
}

/* Dropdown transition animations */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-fade-enter-to,
.dropdown-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Dropdown fade-in animation */
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
</style>
