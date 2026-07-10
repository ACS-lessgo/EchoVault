<template>
  <aside class="side-nav" :class="{ collapsed: collapsed }">
    <div class="nav-scroll">
      <div class="nav-section">
        <button class="section-header" @click="toggleSection('main')">
          <span>{{ t('nav.section.app') }}</span>
          <ChevronDown class="chevron" :class="{ closed: !sections.main }" :size="14" />
        </button>
        <nav v-show="sections.main">
          <router-link to="/" class="nav-item">
            <Home class="nav-icon" :size="20" />
            <span>{{ t('nav.home') }}</span>
          </router-link>

          <router-link to="/songs" class="nav-item">
            <Music class="nav-icon" :size="20" />
            <span>{{ t('nav.allSongs') }}</span>
          </router-link>

          <router-link to="/artists" class="nav-item">
            <User class="nav-icon" :size="20" />
            <span>{{ t('nav.artists') }}</span>
          </router-link>
        </nav>
      </div>

      <div class="nav-section">
        <button class="section-header" @click="toggleSection('library')">
          <span>{{ t('nav.section.library') }}</span>
          <ChevronDown class="chevron" :class="{ closed: !sections.library }" :size="14" />
        </button>
        <nav v-show="sections.library">
          <router-link to="/library" class="nav-item">
            <Library class="nav-icon" :size="20" />
            <span>{{ t('nav.library') }}</span>
          </router-link>
        </nav>
      </div>

      <div class="nav-section">
        <button class="section-header" @click="toggleSection('playlists')">
          <span>{{ t('nav.section.playlists') }}</span>
          <ChevronDown class="chevron" :class="{ closed: !sections.playlists }" :size="14" />
        </button>
        <div v-show="sections.playlists" class="playlist-list">
          <router-link to="/playlists" class="nav-item">
            <ListMusic class="nav-icon" :size="20" />
            <span>{{ t('nav.playlists') }}</span>
          </router-link>

          <router-link
            v-for="p in playlists"
            :key="p.id"
            :to="`/playlists/${p.id}`"
            class="playlist-item"
            :title="p.name"
          >
            <img v-if="p.coverUrl" :src="p.coverUrl" class="playlist-thumb" draggable="false" />
            <div v-else class="playlist-thumb playlist-thumb-default">
              <Music :size="12" />
            </div>
            <span class="playlist-name">{{ p.name }}</span>
          </router-link>

          <p v-if="!playlists.length" class="empty-hint">{{ t('labels.noPlaylists') }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { Home, Music, User, Library, ListMusic, ChevronDown } from '@lucide/vue'
import { usePlaylistsStore } from '../store/playlists.js'

const { t } = useI18n()
defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
})

const playlistsStore = usePlaylistsStore()
const { playlists } = storeToRefs(playlistsStore)

const sections = reactive({ main: true, library: true, playlists: true })
function toggleSection(key) {
  sections[key] = !sections[key]
}

onMounted(() => {
  playlistsStore.loadPlaylists()
})
</script>

<style scoped>
/* Sidebar navigation – layout, sections, nav items, playlist list, and responsive collapse */

/* Sidebar container */
.side-nav {
  width: 220px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  color: var(--text-color);
  border-right: 1px solid var(--border-color);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
}

.nav-scroll {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Collapsed state when queue is open */
.side-nav.collapsed {
  width: 60px;
  padding: 1rem 0.5rem;
}

.side-nav.collapsed .section-header,
.side-nav.collapsed .playlist-list {
  display: none;
}

.side-nav.collapsed .nav-item {
  justify-content: center;
  gap: 0;
}

.side-nav.collapsed .nav-item span {
  display: none;
}

.side-nav.collapsed .nav-icon {
  margin: 0 auto;
}

/* Section header */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 10px;
  background: transparent;
  color: var(--muted-text);
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
}

.chevron {
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.chevron.closed {
  transform: rotate(-90deg);
}

/* Navigation list */
nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Navigation link */
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--text-color);
  padding: 8px 10px;
  border-radius: var(--radius-md);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.nav-item:hover {
  background-color: var(--hover-bg);
}

/* Active route */
.nav-item.router-link-active {
  background-color: var(--hover-bg);
  color: var(--accent);
  font-weight: 600;
}

.nav-item.router-link-active .nav-icon {
  color: var(--accent);
}

/* Navigation icons (Lucide SVGs inherit color via currentColor) */
.nav-icon {
  color: var(--text-color);
  flex-shrink: 0;
}

/* Playlist list */
.playlist-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 280px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text-color);
  padding: 6px 10px;
  border-radius: var(--radius-md);
  transition: background-color 0.2s ease;
}

.playlist-item:hover {
  background-color: var(--hover-bg);
}

.playlist-item.router-link-active {
  background-color: var(--hover-bg);
  color: var(--accent);
  font-weight: 600;
}

.playlist-thumb {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  flex-shrink: 0;
}

.playlist-thumb-default {
  background: var(--topbar-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted-text);
}

.playlist-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-sm);
}

.empty-hint {
  padding: 6px 10px;
  color: var(--muted-text);
  font-size: var(--font-size-xs);
  margin: 0;
}

/* Responsive: collapsed sidebar mode */
@media (max-width: 968px) {
  .side-nav {
    width: 50px;
    padding: auto;
    align-items: center;
  }

  .section-header,
  .playlist-list {
    display: none;
  }

  .nav-item {
    justify-content: center;
    gap: 0;
  }

  .nav-item span {
    display: none;
  }

  .nav-icon {
    margin: 0 auto;
  }
}
</style>
