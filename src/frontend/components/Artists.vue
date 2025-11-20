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

      <TrackList
        v-if="viewMode === 'list'"
        :tracks="artistTracks"
        :currentTrack="player.currentTrack"
        :formatDuration="formatDuration"
        :playlists="playlists"
        :currentPlaylistId="null"
        @select="playCurrentTrack"
        @add-to-playlist="handleAddToPlaylist"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue"
import { useSearchStore } from "../store/search.js"
import { usePlayerStore } from "../store/player.js"
import TrackList from "./TrackList.vue"

const artists = ref([])
const filteredArtists = ref([])
const artistTracks = ref([]) // current tracks shown in artist view
const selectedArtist = ref(null)
const isArtistView = ref(true)
const viewMode = ref("list")
const playlists = ref([])

const search = useSearchStore()
const player = usePlayerStore()

// --- Reusable cover attach helpers ---
function formatTrack(track) {
  if (!track) return { ...track }
  if (!track.cover) return { ...track, coverDataUrl: null }

  const url = track.cover.startsWith("/")
    ? `echovault://${track.cover}`
    : `echovault:///${track.cover}`
  return { ...track, coverDataUrl: url }
}

async function formatTracks(list) {
  // keep in Promise.all so parallel processing
  return Promise.all((list || []).map((t) => Promise.resolve(formatTrack(t))))
}

// --- Lifecycle ---
onMounted(async () => {
  await loadArtists()
  await loadPlaylists()
})

// --- Load Artists ---
async function loadArtists() {
  const result = await window.api.getArtists()
  artists.value = await formatTracks(result)
  filteredArtists.value = artists.value
}

// --- When Artist Clicked ---
async function openArtist(artistId) {
  const artist = artists.value.find((a) => a.id === artistId)
  selectedArtist.value = artist

  // If there's a current search query, use the DB search constrained to this artist
  const q = (search.query || "").trim()
  if (q) {
    const result = await window.api.searchTracks({ query: q, artistId })
    artistTracks.value = await formatTracks(result)
  } else {
    // No search → load all tracks for artist (existing API)
    const songs = await window.api.getTracksByArtist(artistId)
    artistTracks.value = await formatTracks(songs)
  }

  isArtistView.value = false
  await nextTick()
}

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

// --- Playing Track ---
function playCurrentTrack(track) {
  if (player.queueSource !== "artist") {
    player.clearQueue()
    player.queue = artistTracks.value.map((t) => ({ ...t }))
    player.queueSource = "artist"
  }

  const index = player.queue.findIndex((t) => t.file_path === track.file_path)
  if (index !== -1) {
    player.currentIndex = index
    player.setTrack(player.queue[index], false)
  } else {
    player.setTrack(track)
  }
}

// artist search watcher
watch(
  () => search.query,
  async (q) => {
    const query = (q || "").trim()

    // Artist list view
    if (!selectedArtist.value) {
      if (!query) {
        filteredArtists.value = artists.value
        return
      }
      const result = await window.api.searchArtists(query)
      filteredArtists.value = await formatTracks(result)
      return
    }

    // Artist detail view (songs)
    if (isArtistView.value === true) {
      return // don't update artistTracks in artist list view
    }

    if (!query) {
      const songs = await window.api.getTracksByArtist(selectedArtist.value.id)
      artistTracks.value = await formatTracks(songs)
      return
    }

    const result = await window.api.searchTracks({
      query,
      artistId: selectedArtist.value.id,
    })
    artistTracks.value = await formatTracks(result)
  },
  { immediate: true }
)

async function loadPlaylists() {
  playlists.value = await window.api.getPlaylists()
}

async function handleAddToPlaylist({ track, playlistId }) {
  await window.api.addTrackToPlaylist(playlistId, track.id)
  await loadPlaylists()
}
</script>

<style scoped>
/* Artists grid container */
.artists-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

/* Artist/track card base */
.track-card {
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
  cursor: pointer;
}

.track-card:hover {
  transform: translateY(-4px);
  opacity: 1;
}

/* Circular artist cover */
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

/* Card info text layout */
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

/* Artist-specific styling */
.artist-cover-image {
  border-radius: 100%;
}

/* Artist header section */
.artist-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);
}

/* Back button styling */
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
</style>
