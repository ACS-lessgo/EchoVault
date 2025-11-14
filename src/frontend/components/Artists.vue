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
        :tracks="filteredTracks"
        :currentTrack="player.currentTrack"
        :formatDuration="formatDuration"
        @select="playCurrentTrack"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue"
import { useSearchStore } from "../store/search.js"
import { usePlayerStore } from "../store/player.js"
import TrackList from "./TrackList.vue"

const artists = ref([])
const artistTracks = ref([])
const selectedArtist = ref(null)
const isArtistView = ref(true)
const viewMode = ref("list")

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
        const url = artist.cover.startsWith("/")
          ? `echovault://${artist.cover}`
          : `echovault:///${artist.cover}`
        return {
          ...artist,
          coverDataUrl: url,
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

  artistTracks.value = sorted
  isArtistView.value = false

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
