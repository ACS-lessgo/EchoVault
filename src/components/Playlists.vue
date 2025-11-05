<template>
  <div class="placeholder">
    <h2>Liked Songs</h2>
    <div class="list-view">
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
                  src="../assests/images/default-cover.svg"
                  :alt="track.title"
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useSearchStore } from "../store/search.js"
import { usePlayerStore } from "../store/player.js"

const tracks = ref([])
const viewMode = ref("list")

const search = useSearchStore()
const player = usePlayerStore()

async function loadTracks() {
  const result = await window.api.getLikedTracks()

  // For each track, load cover as Base64 and attach it
  const withCovers = await Promise.all(
    result.map(async (track) => {
      if (track.cover) {
        const coverDataUrl = await window.api.getCoverDataUrl(track.cover)
        return { ...track, coverDataUrl }
      } else {
        return { ...track, coverDataUrl: null }
      }
    })
  )

  tracks.value = withCovers
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
  player.setTrack(track)
}
</script>

<style scoped>
/* List View Styles */
.list-view {
  width: 100%;
}

.track-table {
  width: 100%;
  border-collapse: collapse;
}

.track-table thead {
  border-bottom: 1px solid var(--border-color);
}

.track-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.num-col {
  width: 50px;
}

.title-col {
  width: 45%;
}

.album-col {
  width: 35%;
  text-align: left;
}

.duration-col {
  width: 100px;
  text-align: left;
}

.track-row {
  transition: background 0.2s;
  cursor: pointer;
}

.track-row td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.track-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.track-cover {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  object-fit: cover;
}

.track-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.track-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-color);
}

.track-artist {
  font-size: 13px;
  color: var(--muted-text);
}

/* Alternate greys bg */

.track-table tbody tr:nth-child(odd) {
  background-color: var(--side-nav-bg);
}

.track-table tbody tr:nth-child(even) {
  background-color: transparent;
}

.track-table tbody tr.track-row:hover {
  background: var(--hover-bg);
}
</style>
