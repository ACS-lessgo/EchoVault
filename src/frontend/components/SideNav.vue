<template>
  <aside class="side-nav" :class="{ collapsed: collapsed }">
    <nav>
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

      <router-link to="/library" class="nav-item">
        <Library class="nav-icon" :size="20" />
        <span>{{ t('nav.library') }}</span>
      </router-link>

      <router-link to="/playlists" class="nav-item">
        <ListMusic class="nav-icon" :size="20" />
        <span>{{ t('nav.playlists') }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { Home, Music, User, Library, ListMusic } from '@lucide/vue'

const { t } = useI18n()
defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
/* Sidebar navigation – layout, nav items, icons, and responsive collapse */

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
}

/* Collapsed state when queue is open */
.side-nav.collapsed {
  width: 60px;
  padding: 1rem 0.5rem;
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
  border-radius: 8px;
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

/* Responsive: collapsed sidebar mode */
@media (max-width: 968px) {
  .side-nav {
    width: 50px;
    padding: auto;
    align-items: center;
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
