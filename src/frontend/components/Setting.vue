<template>
  <transition name="settings-fade">
    <div v-if="showSettingMenu" class="settings-overlay">
      <div class="settings-container">
        <!-- Header -->
        <div class="settings-header">
          <h1 class="settings-title">Settings</h1>
          <button @click="$emit('close')" class="close-button">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Content Area -->
        <div class="settings-content">
          <!-- Sidebar Tabs -->
          <div class="settings-sidebar">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="tab-button"
              :class="{ active: activeTab === tab.id }"
            >
              <i :class="tab.icon"></i>
              <span>{{ tab.label }}</span>
            </button>
          </div>

          <!-- Main Content -->
          <div class="settings-main">
            <!-- Appearance Tab -->
            <div v-if="activeTab === 'appearance'" class="tab-content">
              <h2 class="section-title">Appearance</h2>
              <p class="section-description">
                Customize the look and feel of your music player
              </p>

              <!-- Theme Mode -->
              <div class="setting-group">
                <div class="setting-label">
                  <i class="fa-solid fa-moon"></i>
                  <div>
                    <h3>Theme Mode</h3>
                    <p>Choose between light and dark mode</p>
                  </div>
                </div>
                <div class="theme-toggle">
                  <button
                    @click="setTheme('light')"
                    class="theme-option"
                    :class="{ active: !isDarkMode }"
                  >
                    <i class="fa-solid fa-sun"></i>
                    <span>Light</span>
                  </button>

                  <button
                    @click="setTheme('dark')"
                    class="theme-option"
                    :class="{ active: isDarkMode }"
                  >
                    <i class="fa-solid fa-moon"></i>
                    <span>Dark</span>
                  </button>
                </div>
              </div>

              <!-- Accent Color -->
              <div class="setting-group">
                <div class="setting-label">
                  <i class="fa-solid fa-palette"></i>
                  <div>
                    <h3>Accent Color</h3>
                    <p>Select your preferred accent color</p>
                  </div>
                </div>
                <div class="color-grid">
                  <div
                    v-for="color in accentColors"
                    :key="color.name"
                    @click="setAccent(color.value)"
                    class="color-swatch"
                    :class="{ active: activeAccent === color.value }"
                    :style="{ background: color.value }"
                  >
                    <i
                      v-if="activeAccent === color.value"
                      class="fa-solid fa-check"
                    ></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- Language Tab -->
            <div v-if="activeTab === 'language'" class="tab-content">
              <h2 class="section-title">Language & Region</h2>
              <p class="section-description">
                Configure your language preferences
              </p>

              <div class="setting-group">
                <div class="setting-label">
                  <i class="fa-solid fa-language"></i>
                  <div>
                    <h3>Display Language</h3>
                    <p>Choose your preferred language</p>
                  </div>
                </div>
                <div class="language-selector">
                  <button
                    @click="setLanguage('en')"
                    class="language-option"
                    :class="{ active: currentLocale === 'en' }"
                  >
                    <span class="flag">🇬🇧</span>
                    <div>
                      <div class="lang-name">English</div>
                      <div class="lang-native">English</div>
                    </div>
                    <i
                      v-if="currentLocale === 'en'"
                      class="fa-solid fa-check"
                    ></i>
                  </button>
                  <button
                    @click="setLanguage('ja')"
                    class="language-option"
                    :class="{ active: currentLocale === 'ja' }"
                  >
                    <span class="flag">🇯🇵</span>
                    <div>
                      <div class="lang-name">Japanese</div>
                      <div class="lang-native">日本語</div>
                    </div>
                    <i
                      v-if="currentLocale === 'ja'"
                      class="fa-solid fa-check"
                    ></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Audio Tab -->
            <div v-if="activeTab === 'audio'" class="tab-content">
              <h2 class="section-title">Audio Settings</h2>
              <p class="section-description">
                Configure audio playback and equalizer
              </p>

              <div class="setting-group disabled">
                <div class="setting-label">
                  <i class="fa-solid fa-sliders"></i>
                  <div>
                    <h3>Equalizer</h3>
                    <p>Adjust audio frequencies to your preference</p>
                  </div>
                </div>
                <div class="coming-soon-badge">Coming Soon</div>
              </div>

              <div class="setting-group disabled">
                <div class="setting-label">
                  <i class="fa-solid fa-volume-high"></i>
                  <div>
                    <h3>Normalization</h3>
                    <p>Normalize volume levels across tracks</p>
                  </div>
                </div>
                <div class="coming-soon-badge">Coming Soon</div>
              </div>
            </div>

            <!-- Shortcuts Tab -->
            <div v-if="activeTab === 'shortcuts'" class="tab-content">
              <h2 class="section-title">Keyboard Shortcuts</h2>
              <p class="section-description">
                View and customize keyboard shortcuts
              </p>

              <div class="setting-group disabled">
                <div class="setting-label">
                  <i class="fa-solid fa-keyboard"></i>
                  <div>
                    <h3>Playback Controls</h3>
                    <p>Shortcuts for play, pause, skip, and more</p>
                  </div>
                </div>
                <div class="coming-soon-badge">Coming Soon</div>
              </div>

              <div class="setting-group disabled">
                <div class="setting-label">
                  <i class="fa-solid fa-arrow-pointer"></i>
                  <div>
                    <h3>Navigation Shortcuts</h3>
                    <p>Quick access to different sections</p>
                  </div>
                </div>
                <div class="coming-soon-badge">Coming Soon</div>
              </div>
            </div>

            <!-- About Tab -->
            <div v-if="activeTab === 'about'" class="tab-content">
              <h2 class="section-title">About</h2>
              <p class="section-description">
                Information about this music player
              </p>

              <div class="about-card">
                <div class="app-icon">
                  <i class="fa-solid fa-music"></i>
                </div>
                <h3>Music Player</h3>
                <p class="version">Version 1.0.0</p>
                <p class="description">
                  A modern, feature-rich music player built with Vue.js and
                  Electron
                </p>
                <div class="about-links">
                  <button class="link-button">
                    <i class="fa-solid fa-globe"></i>
                    Website
                  </button>
                  <button class="link-button">
                    <i class="fa-brands fa-github"></i>
                    GitHub
                  </button>
                  <button class="link-button">
                    <i class="fa-solid fa-file-lines"></i>
                    License
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import { useI18n } from "vue-i18n"
import { useThemeStore } from "../store/theme.js"

const props = defineProps({
  showSettingMenu: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(["close"])
const themeStore = useThemeStore()
const { locale } = useI18n()

const activeTab = ref("appearance")

// use store for theme
const isDarkMode = computed(() => themeStore.theme === "dark")

// locale + accent
const currentLocale = ref(localStorage.getItem("locale") || "en")
const activeAccent = ref(localStorage.getItem("accentColor") || "#8e44ad")

const tabs = [
  { id: "appearance", label: "Appearance", icon: "fa-solid fa-palette" },
  { id: "language", label: "Language", icon: "fa-solid fa-language" },
  { id: "audio", label: "Audio", icon: "fa-solid fa-sliders" },
  { id: "shortcuts", label: "Shortcuts", icon: "fa-solid fa-keyboard" },
  { id: "about", label: "About", icon: "fa-solid fa-circle-info" },
]

const accentColors = [
  { name: "Purple", value: "#8e44ad" },
  { name: "Blue", value: "#3498db" },
  { name: "Green", value: "#27ae60" },
  { name: "Orange", value: "#e67e22" },
  { name: "Pink", value: "#e84393" },
  { name: "Red", value: "#c0392b" },
  { name: "Teal", value: "#1abc9c" },
  { name: "Indigo", value: "#6c5ce7" },
]

const setTheme = (theme) => {
  themeStore.setTheme(theme)
}

const toggleTheme = () => {
  themeStore.toggleTheme()
}

// language
const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
  localStorage.setItem("locale", lang)
}

// accent
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
}

// utils
function hexToRgba(hex, alpha = 0.25) {
  const c = hex.replace("#", "")
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

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

onMounted(() => {
  // keep locale and accent initialization here (theme is initialized in store)
  const savedLang = localStorage.getItem("locale")
  if (savedLang) {
    currentLocale.value = savedLang
    locale.value = savedLang
  }

  const savedColor = localStorage.getItem("accentColor")
  if (savedColor) {
    activeAccent.value = savedColor
    // optionally re-apply CSS variables on mount:
    setAccent(savedColor)
  }
})
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--bg-color);
  z-index: 9999;
  overflow: hidden;
}

.settings-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Header */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 3rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--topbar-bg);
}

.settings-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.close-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: var(--search-bar-color);
  color: var(--text-color);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: var(--hover-bg);
  transform: rotate(90deg);
}

/* Content */
.settings-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.settings-sidebar {
  width: 280px;
  background: var(--side-nav-bg);
  border-right: 1px solid var(--border-color);
  padding: 2rem 1rem;
  overflow-y: auto;
}

.tab-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  color: var(--muted-text);
  font-size: 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
  text-align: left;
}

.tab-button i {
  font-size: 1.25rem;
  width: 24px;
}

.tab-button:hover {
  background: var(--hover-bg);
  color: var(--text-color);
}

.tab-button.active {
  background: var(--accent);
  color: white;
}

/* Main Content */
.settings-main {
  flex: 1;
  padding: 3rem;
  overflow-y: auto;
  max-width: 900px;
}

.tab-content {
  animation: fadeInUp 0.3s ease;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.section-description {
  font-size: 1rem;
  color: var(--muted-text);
  margin: 0 0 2rem 0;
}

/* Setting Groups */
.setting-group {
  background: var(--side-nav-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  transition: all 0.2s ease;
}

.setting-group:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.setting-group.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.setting-label {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.setting-label > i {
  font-size: 1.5rem;
  color: var(--accent);
  margin-top: 0.25rem;
}

.setting-label h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.25rem 0;
}

.setting-label p {
  font-size: 0.9rem;
  color: var(--muted-text);
  margin: 0;
}

/* Theme Toggle */
.theme-toggle {
  display: flex;
  gap: 1rem;
}

.theme-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-color);
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-option:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.theme-option.active {
  border-color: var(--accent);
  background: var(--accent);
  color: white;
}

.theme-option i {
  font-size: 1.25rem;
}

/* Color Grid */
.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 1rem;
}

.color-swatch {
  aspect-ratio: 1;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid transparent;
}

.color-swatch:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.color-swatch.active {
  border-color: var(--text-color);
  transform: scale(1.1);
}

.color-swatch i {
  color: white;
  font-size: 1.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.color-swatch.active i {
  opacity: 1;
}

/* Language Selector */
.language-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem;
  border: 2px solid var(--border-color);
  background: var(--bg-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.language-option:hover {
  border-color: var(--accent);
  transform: translateX(4px);
}

.language-option.active {
  border-color: var(--accent);
  background: var(--hover-bg);
}

.flag {
  font-size: 2rem;
}

.lang-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.lang-native {
  font-size: 0.875rem;
  color: var(--muted-text);
}

.language-option i {
  margin-left: auto;
  color: var(--accent);
  font-size: 1.25rem;
}

/* Coming Soon Badge */
.coming-soon-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: var(--accent);
  color: white;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
}

/* About Card */
.about-card {
  background: var(--side-nav-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
}

.app-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: var(--accent);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: white;
}

.about-card h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.version {
  font-size: 1rem;
  color: var(--muted-text);
  margin: 0 0 1rem 0;
}

.description {
  font-size: 1rem;
  color: var(--text-color);
  line-height: 1.6;
  margin: 0 0 2rem 0;
}

.about-links {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.link-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--border-color);
  background: transparent;
  color: var(--text-color);
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.link-button:hover {
  border-color: var(--accent);
  background: var(--hover-bg);
}

/* Animations */
.settings-fade-enter-active,
.settings-fade-leave-active {
  transition: opacity 0.3s ease;
}

.settings-fade-enter-from,
.settings-fade-leave-to {
  opacity: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scrollbar Styling */
.settings-sidebar::-webkit-scrollbar,
.settings-main::-webkit-scrollbar {
  width: 8px;
}

.settings-sidebar::-webkit-scrollbar-track,
.settings-main::-webkit-scrollbar-track {
  background: transparent;
}

.settings-sidebar::-webkit-scrollbar-thumb,
.settings-main::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.settings-sidebar::-webkit-scrollbar-thumb:hover,
.settings-main::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}
</style>
