<template>
  <div class="placeholder">
    <!-- Artists Grid -->
    <div v-if="isArtistView" class="artists-container">
      <div
        v-for="artist in filteredArtists"
        :key="artist.id"
        class="track-card"
        @click="openArtist(artist.id)"
      >
        <div class="card-cover">
          <img
            v-if="artist.coverDataUrl"
            :src="artist.coverDataUrl"
            :alt="artist.name"
            class="artist-cover-image"
          />
          <img
            v-else
            src="../assets/images/default-cover.svg"
            :alt="artist.name"
            class="artist-cover-image"
          />
        </div>
        <div class="card-info">
          <div class="card-title">{{ artist.name }}</div>
        </div>
      </div>
    </div>

    <!-- Songs List for Selected Artist -->
    <div v-else class="artist-songs-view">
      <div class="artist-header">
        <button class="back-btn" @click="isArtistView = true"><</button>
        <h2>{{ selectedArtist?.name }}</h2>
      </div>

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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue"
import { useSearchStore } from "../store/search.js"
import { usePlayerStore } from "../store/player.js"

const artists = ref([])
const artistTracks = ref([])
const selectedArtist = ref(null)
const isArtistView = ref(true)

const search = useSearchStore()
const player = usePlayerStore()

// --- Lifecycle ---
onMounted(() => {
  loadArtists()
})

// --- Load Artists ---
async function loadArtists() {
  const result = await window.api.getArtists()
  const withCovers = await Promise.all(
    result.map(async (artist) => {
      if (artist.cover) {
        try {
          const coverDataUrl = await window.api.getCoverDataUrl(artist.cover)
          return { ...artist, coverDataUrl }
        } catch {
          return { ...artist, coverDataUrl: null }
        }
      } else {
        return { ...artist, coverDataUrl: null }
      }
    })
  )
  artists.value = withCovers
}

// --- When Artist Clicked ---
async function openArtist(artistId) {
  const artist = artists.value.find((a) => a.id === artistId)
  selectedArtist.value = artist
  const songs = await window.api.getTracksByArtist(artistId)

  // load song cover data
  const withCovers = await Promise.all(
    songs.map(async (track) => {
      if (track.cover) {
        const coverDataUrl = await window.api.getCoverDataUrl(track.cover)
        return { ...track, coverDataUrl }
      } else {
        return { ...track, coverDataUrl: null }
      }
    })
  )

  // sort by title
  const sorted = withCovers.sort((a, b) =>
    a.title?.localeCompare(b.title, undefined, { sensitivity: "base" })
  )

  artistTracks.value = sorted
  isArtistView.value = false

  // reset queue and reinitialize it
  if (player.isPlaying) {
    player.clearQueue()
    player.queue = sorted
  } else {
    player.clearQueue()
    player.queue = sorted

    // update player state with first track
    player.currentIndex = 0
    player.currentTrack = sorted[0] || {}
  }

  await nextTick()
}

// --- Filter Artists ---
const filteredArtists = computed(() => {
  const q = search.query?.trim().toLowerCase()
  if (!q) return artists.value
  return artists.value.filter((a) => a.name?.toLowerCase().includes(q))
})

// --- Format Duration ---
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

// --- Stub for Playing Track ---
function playCurrentTrack(track) {
  player.setTrack(track)
}

const filteredTracks = computed(() => {
  const q = search.query?.trim().toLowerCase()
  if (!q) return artistTracks.value

  return artistTracks.value.filter((t) => {
    const title = t.title?.toLowerCase() || ""
    const artist = t.artist?.toLowerCase() || ""
    const album = t.album?.toLowerCase() || ""
    return title.includes(q) || artist.includes(q) || album.includes(q)
  })
})
</script>

<style scoped>
.artists-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.track-card {
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
  cursor: pointer;
}

.track-card:hover {
  transform: translateY(-4px);
}

.card-cover {
  position: relative;
  margin-bottom: 16px;
  border-radius: 100%;
  overflow: hidden;
}

.card-cover img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

.track-card:hover {
  opacity: 1;
}

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

.artist-cover-image {
  border-radius: 100%;
}

.artist-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--hover-bg);
  color: var(--text-color);
  font-size: 1.2rem;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.back-btn:hover {
  background: var(--accent);
  color: #fff;
  transform: scale(1.05);
  box-shadow: 0 0 8px var(--accent-hover);
}

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

.track-row.playing {
  background: var(--hover-bg);
  transition: background 0.3s;
  box-shadow: inset 2px 0 0 var(--accent);
}

.track-card.playing {
  outline: 2px solid var(--accent);
  background: var(--hover-bg);
  transition: background 0.3s;
}
</style>
