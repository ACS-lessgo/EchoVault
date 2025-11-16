<template>
  <div class="music-container">
    <div class="header">
      <h2>All Tracks</h2>
      <div class="view-toggle">
        <button
          :class="['toggle-btn', { active: viewMode === 'list' }]"
          @click="viewMode = 'list'"
        >
          <i class="fas fa-bars"></i>
        </button>
        <button
          :class="['toggle-btn', { active: viewMode === 'grid' }]"
          @click="viewMode = 'grid'"
        >
          <i class="fas fa-th-large"></i>
        </button>
      </div>
    </div>

    <!-- List View -->
    <TrackList
      v-if="viewMode === 'list'"
      :tracks="filteredTracks"
      :currentTrack="player.currentTrack"
      :formatDuration="formatDuration"
      @select="playCurrentTrack"
    />

    <!-- Grid View -->
    <TrackGrid
      v-else
      :tracks="filteredTracks"
      :currentTrack="player.currentTrack"
      @select="playCurrentTrack"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue"
import { useSearchStore } from "../store/search.js"
import { usePlayerStore } from "../store/player.js"
import TrackList from "./TrackList.vue"
import TrackGrid from "./TrackGrid.vue"

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

  tracks.value = withCovers

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
</style>
