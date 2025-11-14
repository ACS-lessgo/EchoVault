<template>
  <div class="music-container">
    <div class="header">
      <h2>All Tracks</h2>
      <div class="view-toggle">
        <button
          :class="['toggle-btn', { active: viewMode === 'list' }]"
          @click="viewMode = 'list'"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </button>
        <button
          :class="['toggle-btn', { active: viewMode === 'grid' }]"
          @click="viewMode = 'grid'"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </button>
      </div>
    </div>

    <!-- List View -->
    <!-- <div v-if="viewMode === 'list'" class="list-view">
      <table class="track-table">
        <thead>
          <tr>
            <th class="num-col">#</th>
            <th class="title-col">Title</th>
            <th class="album-col">Album</th>
            <th class="duration-col">Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(track, index) in filteredTracks"
            :key="track.id"
            class="track-row"
            :class="{
              playing: player.currentTrack?.file_path === track.file_path,
            }"
            @click="playCurrentTrack(track)"
          >
            <td class="num-col">{{ index + 1 }}</td>
            <td class="title-col">
              <div class="track-info">
                <img
                  v-if="track.coverDataUrl"
                  :src="track.coverDataUrl"
                  :alt="track.title"
                  class="track-cover"
                />
                <img
                  v-else
                  src="../assets/images/default-cover.svg"
                  :alt="track.title"
                  class="track-cover"
                />
                <div class="track-details">
                  <div class="track-title">{{ track.title }}</div>
                  <div class="track-artist">{{ track.artist }}</div>
                </div>
              </div>
            </td>
            <td class="album-col">{{ track.album }}</td>
            <td class="duration-col">{{ formatDuration(track.duration) }}</td>
          </tr>
        </tbody>
      </table>
    </div> -->

    <TrackList
      v-if="viewMode === 'list'"
      :tracks="filteredTracks"
      :currentTrack="player.currentTrack"
      :formatDuration="formatDuration"
      @select="playCurrentTrack"
    />

    <!-- Grid View -->
    <div v-else class="grid-view">
      <div
        v-for="track in filteredTracks"
        :key="track.id"
        class="track-card"
        :class="{ playing: player.currentTrack?.file_path === track.file_path }"
      >
        <div class="card-cover">
          <img
            v-if="track.coverDataUrl"
            :src="track.coverDataUrl"
            :alt="track.title"
          />
          <img
            v-else
            src="../assets/images/default-cover.svg"
            :alt="track.title"
          />
          <div class="play-overlay">
            <button class="play-btn" @click="playCurrentTrack(track)">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>
        <div class="card-info">
          <div class="card-title">{{ track.title }}</div>
          <div class="card-artist">{{ track.artist }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue"
import { useSearchStore } from "../store/search.js"
import { usePlayerStore } from "../store/player.js"
import TrackList from "./TrackList.vue"

const tracks = ref([])
const viewMode = ref("list")

const search = useSearchStore()
const player = usePlayerStore()

async function loadTracks() {
  const result = await window.api.getTracks()

  // For each track, load cover as Base64 and attach it
  const withCovers = await Promise.all(
    result.map(async (track) => {
      if (track.cover) {
        const url = track.cover.startsWith("/")
          ? `echovault://${track.cover}`
          : `echovault:///${track.cover}`
        return {
          ...track,
          coverDataUrl: url,
        }
      } else {
        return { ...track, coverDataUrl: null }
      }
    })
  )

  // sort by title
  const sorted = withCovers.sort((a, b) =>
    a.title?.localeCompare(b.title, undefined, { sensitivity: "base" })
  )

  tracks.value = sorted

  if (Object.keys(player.currentTrack).length === 0) {
    player.clearQueue()
    player.queue = structuredClone(sorted)
    player.currentIndex = 0
    player.currentTrack = { ...sorted[0] } || {}
    player.queueSource = "all"
  }

  await nextTick()
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  const minLabel = mins === 1 ? "min" : "mins"
  const secLabel = secs === 1 ? "sec" : "secs"

  if (mins > 0 && secs > 0) {
    return `${mins} ${minLabel} ${secs} ${secLabel}`
  } else if (mins > 0) {
    return `${mins} ${minLabel}`
  } else {
    return `${secs} ${secLabel}`
  }
}

onMounted(loadTracks)

const filteredTracks = computed(() => {
  const q = search.query?.trim().toLowerCase()
  if (!q) return tracks.value

  return tracks.value.filter((t) => {
    const title = t.title?.toLowerCase() || ""
    const artist = t.artist?.toLowerCase() || ""
    const album = t.album?.toLowerCase() || ""
    return title.includes(q) || artist.includes(q) || album.includes(q)
  })
})

// Send to store for Player component
function playCurrentTrack(track) {
  if (player.queueSource !== "all") {
    player.clearQueue()
    player.queue = tracks.value.map((t) => ({ ...t }))
    player.queueSource = "all"
  }

  const index = player.queue.findIndex((t) => t.file_path === track.file_path)
  if (index !== -1) {
    player.currentIndex = index
    player.setTrack(player.queue[index], false)
  } else {
    player.setTrack(track)
  }
}

// TODO : Add pagination OR Virtual scroll list
</script>

<style scoped>
/* ────────────────────────────────
    Base Container
──────────────────────────────── */
.music-container {
  /* padding: 20px; */
  color: var(--text-color);
}

/* ────────────────────────────────
    Header & View Toggle Controls
──────────────────────────────── */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h2 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
}

/* View toggle buttons container */
.view-toggle {
  display: flex;
  gap: 8px;
  background: var(--side-nav-bg);
  padding: 4px;
  border-radius: 8px;
}

/* Individual toggle button */
.toggle-btn {
  background: transparent;
  border: none;
  color: var(--muted-text);
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn:hover {
  background: var(--hover-bg);
  color: var(--text-color);
}

.toggle-btn.active {
  background: var(--accent);
  color: white;
}

/* ────────────────────────────────
  Grid View Styles
──────────────────────────────── */
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

/* Individual track card */
.track-card {
  background: var(--side-nav-bg);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
  cursor: pointer;
}

.track-card:hover {
  background: var(--topbar-bg);
  transform: translateY(-4px);
}

/* Album art container */
.card-cover {
  position: relative;
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.card-cover img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

/* Play overlay (on hover) */
.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.track-card:hover .play-overlay {
  opacity: 1;
}

/* Play button inside overlay */
.play-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  color: var(--text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.play-btn:hover {
  background: var(--accent-hover);
  transform: scale(1.1);
}

/* Card info text */
.card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-artist {
  font-size: 13px;
  color: var(--muted-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Currently playing card (grid view) */
.track-card.playing {
  outline: 2px solid var(--accent);
  background: var(--hover-bg);
  transition: background 0.3s;
}
</style>
