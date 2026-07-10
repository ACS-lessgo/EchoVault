<template>
  <div class="search-results">
    <template v-if="!query">
      <p class="prompt-state">{{ t('search.startTyping') }}</p>
    </template>

    <template v-else>
      <h2 class="results-heading">
        {{ t('search.resultsFor') }} "{{ query }}"
      </h2>

      <p v-if="!hasResults" class="no-results">{{ t('search.noResults') }}</p>

      <template v-else>
        <section v-if="tracks.length" class="results-section">
          <div class="section-header">
            <h3>{{ t('search.songs') }}</h3>
            <router-link to="/songs" class="see-all-link">
              {{ t('search.seeAllSongs') }}
            </router-link>
          </div>
          <TrackList
            :tracks="tracks"
            :currentTrack="player.currentTrack"
            :formatDuration="formatDurationVerbose"
            :playlists="addablePlaylists"
            :currentPlaylistId="null"
            @select="playCurrentTrack"
            @add-to-playlist="handleAddToPlaylist"
          />
        </section>

        <section v-if="artists.length" class="results-section">
          <div class="section-header">
            <h3>{{ t('search.artists') }}</h3>
            <router-link to="/artists" class="see-all-link">
              {{ t('search.seeAllArtists') }}
            </router-link>
          </div>
          <div class="artists-grid">
            <div
              v-for="artist in artists"
              :key="artist.id"
              class="result-card result-artist-card"
              @click="openArtist(artist.id)"
            >
              <div class="result-card-cover result-artist-cover">
                <img
                  v-if="artist.coverDataUrl"
                  :src="artist.coverDataUrl"
                  :alt="artist.name"
                />
                <img
                  v-else
                  src="../assets/images/default-cover.svg"
                  :alt="artist.name"
                />
              </div>
              <div class="result-card-info">
                <div class="result-card-title">{{ artist.name }}</div>
              </div>
            </div>
          </div>
        </section>

        <section v-if="playlists.length" class="results-section">
          <div class="section-header">
            <h3>{{ t('search.playlists') }}</h3>
          </div>
          <div class="playlists-grid">
            <div
              v-for="playlist in playlists"
              :key="playlist.id"
              class="result-card result-playlist-card"
              @click="openPlaylist"
            >
              <div class="result-card-cover result-playlist-cover">
                <img
                  v-if="playlist.coverDataUrl"
                  :src="playlist.coverDataUrl"
                />
                <div v-else class="default-cover">
                  <i class="fa-solid fa-music"></i>
                </div>
              </div>
              <div class="result-card-info">
                <div class="result-card-title">{{ playlist.name }}</div>
                <p class="result-card-subtitle">
                  {{ playlist.track_count }} {{ t('playlist.tracks') }}
                </p>
              </div>
            </div>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import { useSearchStore } from "../store/search.js"
import { usePlayerStore } from "../store/player.js"
import { attachCoverUrl, formatDurationVerbose } from "../utils/trackFormat.js"
import TrackList from "./TrackList.vue"

const { t } = useI18n()
const router = useRouter()
const search = useSearchStore()
const player = usePlayerStore()

const query = computed(() => search.query)
const tracks = ref([])
const artists = ref([])
const playlists = ref([])

const hasResults = computed(
  () => tracks.value.length || artists.value.length || playlists.value.length
)

async function runSearch(q) {
  const trimmed = (q || "").trim()
  if (!trimmed) {
    tracks.value = []
    artists.value = []
    playlists.value = []
    return
  }

  const result = await window.api.searchAll(trimmed)
  tracks.value = result.tracks.map(attachCoverUrl)
  artists.value = result.artists.map(attachCoverUrl)
  playlists.value = result.playlists.map(attachCoverUrl)
}

watch(() => search.query, runSearch, { immediate: true })

// Reused by TrackList's "add to playlist" menu, same pattern as AllSongs.vue.
const addablePlaylists = ref([])
async function loadAddablePlaylists() {
  addablePlaylists.value = await window.api.getPlaylists()
}
onMounted(loadAddablePlaylists)

async function handleAddToPlaylist({ track, playlistId }) {
  await window.api.addTrackToPlaylist(playlistId, track.id)
  await loadAddablePlaylists()
}

function playCurrentTrack(track) {
  if (player.queueSource !== "search") {
    player.clearQueue()
    player.queue = tracks.value.map((t) => ({ ...t }))
    player.queueSource = "search"
  }

  const index = player.queue.findIndex((t) => t.file_path === track.file_path)
  if (index !== -1) {
    player.currentIndex = index
    player.setTrack(player.queue[index], false)
  } else {
    player.setTrack(track)
  }
}

function openArtist(artistId) {
  router.push(`/artists/${artistId}`)
}

// Playlists.vue selects a playlist via internal state, not a route param,
// so a specific playlist can't be deep-linked yet — land on the grid.
function openPlaylist() {
  router.push("/playlists")
}
</script>

<style scoped>
.search-results {
  padding: 1rem;
}

.prompt-state,
.no-results {
  color: var(--muted-text);
  margin-top: 2rem;
  text-align: center;
}

.results-heading {
  margin: 0 0 1.5rem;
  color: var(--text-color);
}

.results-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  color: var(--text-color);
}

.see-all-link {
  font-size: 0.85rem;
  color: var(--accent);
  text-decoration: none;
}

.see-all-link:hover {
  color: var(--accent-hover);
}

.artists-grid,
.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

.result-card {
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.result-card:hover {
  background-color: var(--hover-bg);
  transform: translateY(-2px);
}

.result-card-cover {
  margin-bottom: 0.75rem;
  overflow: hidden;
}

.result-card-cover img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

.result-artist-cover {
  border-radius: 100%;
}

.result-playlist-cover {
  border-radius: 6px;
  background-color: var(--topbar-bg);
}

.result-playlist-cover .default-cover {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted-text);
  font-size: 1.5rem;
}

.result-card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-card-subtitle {
  font-size: 0.8rem;
  color: var(--muted-text);
  margin: 0.25rem 0 0;
}
</style>
