<template>
  <div class="library-page">
    <header class="library-header">
      <h1>{{ t("library.title") }}</h1>
      <div class="library-meta" v-if="totalTracks > 0">
        <span>{{ totalTracks }} songs</span>
        <span>•</span>
        <span>{{ totalArtists }} artists</span>
        <span>•</span>
        <span>{{ totalAlbums }} albums</span>
      </div>
    </header>

    <section v-if="totalTracks === 0" class="empty-state">
      <i class="fas fa-music empty-icon"></i>
      <h2>{{ t("library.emptyTitle") }}</h2>
      <p>{{ t("library.emptyText") }}</p>
      <button class="accent-btn" @click="router.push('/media')">
        {{ t("library.addFolderCta") }}
      </button>
    </section>

    <section v-else>
      <div class="section-title">
        <h2>{{ t("library.recentlyAdded") }}</h2>
      </div>
      <div class="recent-row">
        <div
          v-for="track in recentTracks"
          :key="track.id"
          class="recent-card"
          @click="playRecent(track)"
        >
          <img
            v-if="track.coverDataUrl"
            :src="track.coverDataUrl"
            class="recent-cover"
          />
          <div v-else class="recent-cover default-cover">
            <i class="fas fa-music"></i>
          </div>
          <div class="recent-title">{{ track.title }}</div>
          <div class="recent-artist">{{ track.artist || "Unknown Artist" }}</div>
        </div>
      </div>
    </section>

    <section>
      <div class="section-links">
        <div class="link-card" @click="router.push('/songs')">
          <Music class="link-icon" :size="28" />
          <div class="link-title">{{ t("nav.allSongs") }}</div>
          <div class="link-sub">{{ totalTracks }} {{ t("labels.tracks") }}</div>
        </div>
        <div class="link-card" @click="router.push('/artists')">
          <User class="link-icon" :size="28" />
          <div class="link-title">{{ t("nav.artists") }}</div>
          <div class="link-sub">{{ totalArtists }} {{ t("library.artists") }}</div>
        </div>
        <div class="link-card" @click="router.push('/playlists')">
          <ListMusic class="link-icon" :size="28" />
          <div class="link-title">{{ t("nav.playlists") }}</div>
          <div class="link-sub">{{ totalPlaylists }} {{ t("library.playlists") }}</div>
        </div>
        <div class="link-card" @click="router.push('/media')">
          <FolderCog class="link-icon" :size="28" />
          <div class="link-title">{{ t("nav.media") }}</div>
          <div class="link-sub">{{ totalFolders }} {{ t("library.folders") }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import { Music, User, ListMusic, FolderCog } from "@lucide/vue"
import { usePlayerStore } from "../store/player.js"
import { attachCoverUrl } from "../utils/trackFormat.js"

const { t } = useI18n()
const router = useRouter()
const player = usePlayerStore()

const totalTracks = ref(0)
const totalArtists = ref(0)
const totalAlbums = ref(0)
const totalPlaylists = ref(0)
const totalFolders = ref(0)
const recentTracks = ref([])

async function loadCounts() {
  const [tracks, artists, playlists, folders] = await Promise.all([
    window.api.getTracks(),
    window.api.getArtists(),
    window.api.getPlaylists(),
    window.api.getFolders(),
  ])

  totalTracks.value = tracks.length
  totalArtists.value = artists.length
  totalAlbums.value = new Set(tracks.map((t) => t.album).filter(Boolean)).size
  totalPlaylists.value = playlists?.length || 0
  totalFolders.value = folders.length
}

async function loadRecentTracks() {
  const tracks = await window.api.getRecentTracks()
  recentTracks.value = tracks.map(attachCoverUrl)
}

function playRecent(track) {
  if (player.queueSource !== "library-recent") {
    player.clearQueue()
    player.queue = recentTracks.value.map((t) => ({ ...t }))
    player.queueSource = "library-recent"
  }

  const index = player.queue.findIndex((t) => t.file_path === track.file_path)
  if (index !== -1) {
    player.currentIndex = index
    player.setTrack(player.queue[index], false)
  } else {
    player.setTrack(track)
  }
}

onMounted(async () => {
  await Promise.all([loadCounts(), loadRecentTracks()])
})
</script>

<style scoped>
.library-page {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 36px;
  background: linear-gradient(180deg, #171717, #111111);
  min-height: 100%;
}

.library-header h1 {
  font-size: 40px;
  margin: 0.25rem 0 1rem;
  color: var(--text-color);
}

.library-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: var(--muted-text);
  font-size: 15px;
  font-weight: 500;
}

.library-meta span:nth-child(even) {
  opacity: 0.35;
}

.section-title {
  margin-bottom: 16px;
}

.section-title h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

/* Recently Added horizontal row */
.recent-row {
  display: flex;
  gap: 18px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.recent-card {
  flex: 0 0 160px;
  width: 160px;
  min-width: 0;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.recent-card:hover {
  transform: translateY(-4px);
}

.recent-cover {
  width: 160px;
  height: 160px;
  border-radius: 12px;
  object-fit: cover;
  background: var(--topbar-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.recent-cover.default-cover {
  color: var(--muted-text);
  font-size: 32px;
}

.recent-title {
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-artist {
  font-size: 13px;
  color: var(--muted-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Section link cards */
.section-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.link-card {
  background: var(--side-nav-bg);
  border-radius: 18px;
  padding: 24px;
  cursor: pointer;
  transition: 0.2s;
}

.link-card:hover {
  background: var(--hover-bg);
  transform: translateY(-3px);
}

.link-icon {
  color: var(--accent);
  margin-bottom: 12px;
}

.link-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 4px;
}

.link-sub {
  font-size: 13px;
  color: var(--muted-text);
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px;
  gap: 16px;
}

.empty-icon {
  font-size: 72px;
  opacity: 0.4;
}

.accent-btn {
  padding: 12px 18px;
  border: none;
  border-radius: 12px;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
}

.accent-btn:hover {
  background: var(--accent-hover);
}
</style>
