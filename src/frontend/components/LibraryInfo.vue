<template>
  <div class="stats-container">
    <h1 class="stats-title">Library Statistics</h1>

    <div class="stats-grid">
      <!-- Total Tracks -->
      <div class="stat-card" :style="{ animationDelay: '0s' }">
        <div class="stat-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ animatedTracks }}</div>
          <div class="stat-label">Total Tracks</div>
        </div>
        <div class="stat-sparkle"></div>
      </div>

      <!-- Total Artists -->
      <div class="stat-card" :style="{ animationDelay: '0.1s' }">
        <div class="stat-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ animatedArtists }}</div>
          <div class="stat-label">Artists</div>
        </div>
        <div class="stat-sparkle"></div>
      </div>

      <!-- Liked Songs -->
      <div class="stat-card" :style="{ animationDelay: '0.2s' }">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ animatedLiked }}</div>
          <div class="stat-label">Liked Songs</div>
        </div>
        <div class="stat-sparkle"></div>
      </div>

      <!-- Storage Used -->
      <div class="stat-card" :style="{ animationDelay: '0.3s' }">
        <div class="stat-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
            />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatStorage(stats.storageUsed) }}</div>
          <div class="stat-label">Storage Used</div>
        </div>
        <div class="stat-sparkle"></div>
      </div>

      <!-- Total Folders -->
      <div class="stat-card" :style="{ animationDelay: '0.4s' }">
        <div class="stat-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
            />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ animatedFolders }}</div>
          <div class="stat-label">Folders</div>
        </div>
        <div class="stat-sparkle"></div>
      </div>

      <!-- Total Duration -->
      <div class="stat-card" :style="{ animationDelay: '0.5s' }">
        <div class="stat-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatDuration(stats.totalDuration) }}
          </div>
          <div class="stat-label">Total Duration</div>
        </div>
        <div class="stat-sparkle"></div>
      </div>

      <!-- Total Listening Time -->
      <div class="stat-card" :style="{ animationDelay: '0.6s' }">
        <div class="stat-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path
              d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"
            />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatListeningTime(animatedListeningTime) }}
          </div>
          <div class="stat-label">Listening Time</div>
        </div>
        <div class="stat-sparkle"></div>
      </div>
    </div>

    <!-- Additional Info Section -->
    <div class="info-section">
      <h2 class="section-title">Top Statistics</h2>

      <div class="info-grid">
        <!-- Most Liked Artist -->
        <div class="info-card" v-if="stats.topArtist">
          <div class="info-header">
            <i class="fas fa-star info-icon"></i>
            <span class="info-title">Most Liked Artist</span>
          </div>
          <div class="info-value">{{ stats.topArtist.name }}</div>
          <div class="info-sub">
            {{ stats.topArtist.likedCount }} liked songs
          </div>
        </div>

        <!-- Average Song Duration -->
        <div class="info-card">
          <div class="info-header">
            <i class="fas fa-clock info-icon"></i>
            <span class="info-title">Average Song Duration</span>
          </div>
          <div class="info-value">{{ formatTime(stats.avgDuration) }}</div>
          <div class="info-sub">per track</div>
        </div>

        <!-- Library Growth -->
        <div class="info-card">
          <div class="info-header">
            <i class="fas fa-chart-line info-icon"></i>
            <span class="info-title">Collection Size</span>
          </div>
          <div class="info-value">{{ stats.totalAlbums }}</div>
          <div class="info-sub">unique albums</div>
        </div>

        <!-- Total Plays -->
        <div class="info-card">
          <div class="info-header">
            <i class="fas fa-headphones info-icon"></i>
            <span class="info-title">Total Plays</span>
          </div>
          <div class="info-value">
            {{ (stats.totalPlays || 0).toLocaleString() }}
          </div>
          <div class="info-sub">all time</div>
        </div>
      </div>
    </div>

    <!-- Most Played Songs -->
    <div class="top-lists-section">
      <div class="top-list">
        <h2 class="section-title">
          <i class="fas fa-fire title-icon"></i>
          Top 10 Most Played Songs
        </h2>
        <div class="top-list-container">
          <div v-if="stats.topTracks.length === 0" class="empty-state">
            <p>
              No plays recorded yet. Start listening to see your top tracks!
            </p>
          </div>
          <div
            v-else
            v-for="(track, index) in stats.topTracks"
            :key="track.id"
            class="top-list-item"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
            <div class="rank">{{ index + 1 }}</div>
            <img
              v-if="track.coverDataUrl"
              :src="track.coverDataUrl"
              alt="Cover"
              class="track-cover"
            />
            <div v-else class="track-cover-placeholder">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div class="track-info">
              <div class="track-name">{{ track.title }}</div>
              <div class="track-artist">
                {{ track.artist || "Unknown Artist" }}
              </div>
            </div>
            <div class="play-count">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="16"
                height="16"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {{ (track.noOfPlays || 0).toLocaleString() }} plays
            </div>
          </div>
        </div>
      </div>

      <!-- Most Played Artists -->
      <div class="top-list">
        <h2 class="section-title">
          <i class="fas fa-crown title-icon"></i>
          Top 10 Most Played Artists
        </h2>
        <div class="top-list-container">
          <div v-if="stats.topArtists.length === 0" class="empty-state">
            <p>
              No plays recorded yet. Start listening to see your top artists!
            </p>
          </div>
          <div
            v-else
            v-for="(artist, index) in stats.topArtists"
            :key="artist.artist"
            class="top-list-item"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
            <div class="rank">{{ index + 1 }}</div>
            <img
              v-if="artist.coverDataUrl"
              :src="artist.coverDataUrl"
              alt="Artist"
              class="artist-cover"
            />
            <div v-else class="artist-avatar">
              {{ artist.artist.charAt(0).toUpperCase() }}
            </div>
            <div class="track-info">
              <div class="track-name">{{ artist.artist }}</div>
              <div class="track-artist">
                {{ artist.trackCount }} tracks in library
              </div>
            </div>
            <div class="play-count">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="16"
                height="16"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {{ (artist.totalPlays || 0).toLocaleString() }} plays
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Refresh Button -->
    <button class="refresh-btn" @click="loadStats" :disabled="loading">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        :class="{ spinning: loading }"
      >
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
      {{ loading ? "Loading..." : "Refresh Stats" }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"

const stats = ref({
  totalTracks: 0,
  totalArtists: 0,
  likedSongs: 0,
  storageUsed: 0,
  totalFolders: 0,
  totalDuration: 0,
  avgDuration: 0,
  totalAlbums: 0,
  topArtist: null,
  totalPlays: 0,
  topTracks: [],
  topArtists: [],
  totalListeningTime: 0,
})

const loading = ref(true)
const animatedTracks = ref(0)
const animatedArtists = ref(0)
const animatedLiked = ref(0)
const animatedFolders = ref(0)
const animatedListeningTime = ref(0)

// Animate numbers
function animateValue(target, duration = 1500) {
  const start = 0
  const startTime = Date.now()

  return new Promise((resolve) => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const current = Math.floor(start + (target - start) * easeOutQuart)

      return current
    }, 16)

    setTimeout(() => {
      clearInterval(timer)
      resolve(target)
    }, duration)
  })
}

// Computed animated values
const updateAnimations = () => {
  const duration = 1500
  const startTime = Date.now()

  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeOutQuart = 1 - Math.pow(1 - progress, 4)

    animatedTracks.value = Math.floor(stats.value.totalTracks * easeOutQuart)
    animatedArtists.value = Math.floor(stats.value.totalArtists * easeOutQuart)
    animatedLiked.value = Math.floor(stats.value.likedSongs * easeOutQuart)
    animatedFolders.value = Math.floor(stats.value.totalFolders * easeOutQuart)
    animatedListeningTime.value = Math.floor(
      stats.value.totalListeningTime * easeOutQuart
    )

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  animate()
}

async function loadStats() {
  loading.value = true

  try {
    // Get total tracks
    const tracks = await window.api.getTracks()
    stats.value.totalTracks = tracks.length

    // Get liked songs
    const likedTracks = await window.api.getLikedTracks()
    stats.value.likedSongs = likedTracks.length

    // Get artists
    const artists = await window.api.getArtists()
    stats.value.totalArtists = artists.length

    // Get folders
    const folders = await window.api.getFolders()
    stats.value.totalFolders = folders.length

    // Calculate storage and duration
    let totalSize = 0
    let totalDuration = 0

    for (const track of tracks) {
      try {
        const size = await window.api.getFileSize(track.file_path)
        totalSize += size
      } catch (e) {
        console.warn("Could not get size for:", track.file_path)
      }
      totalDuration += track.duration || 0
    }

    stats.value.storageUsed = totalSize
    stats.value.totalDuration = totalDuration
    stats.value.avgDuration =
      tracks.length > 0 ? totalDuration / tracks.length : 0

    // Get unique albums
    const albums = new Set(tracks.map((t) => t.album).filter(Boolean))
    stats.value.totalAlbums = albums.size

    // Find most liked artist
    const artistLikes = {}
    likedTracks.forEach((track) => {
      const artist = track.artist || "Unknown"
      artistLikes[artist] = (artistLikes[artist] || 0) + 1
    })

    const topArtistEntry = Object.entries(artistLikes).sort(
      (a, b) => b[1] - a[1]
    )[0]
    if (topArtistEntry) {
      stats.value.topArtist = {
        name: topArtistEntry[0],
        likedCount: topArtistEntry[1],
      }
    }

    // total listening time
    let listeningTime = 0

    for (const track of tracks) {
      const plays = track.noOfPlays || 0
      const duration = track.duration || 0
      listeningTime += duration * plays
    }

    stats.value.totalListeningTime = listeningTime

    // Get top 10 most played tracks
    try {
      const topTracks = await window.api.getTopPlayedTracks()
      stats.value.topTracks = topTracks || []
    } catch (e) {
      console.warn("Could not get top tracks:", e)
      stats.value.topTracks = []
    }

    // Get artists (for covers)
    const allArtists = await window.api.getArtists()

    // Get top 10 most played artists
    try {
      const topArtists = await window.api.getTopPlayedArtists()

      // Add cover URLs for artists by matching with full artists list
      const artistsWithCovers = (topArtists || []).map((topArtist) => {
        // Find matching artist from full list
        const artistData = allArtists.find((a) => a.name === topArtist.artist)

        if (artistData?.cover) {
          const url = artistData.cover.startsWith("/")
            ? `echovault://${artistData.cover}`
            : `echovault:///${artistData.cover}`
          return {
            ...topArtist,
            coverDataUrl: url,
          }
        }

        return { ...topArtist, coverDataUrl: null }
      })

      stats.value.topArtists = artistsWithCovers
    } catch (e) {
      console.warn("Could not get top artists:", e)
      stats.value.topArtists = []
    }

    // Get total plays
    try {
      const totalPlaysResult = await window.api.getTotalPlays()
      stats.value.totalPlays = totalPlaysResult?.totalPlays || 0
    } catch (e) {
      console.warn("Could not get total plays:", e)
      stats.value.totalPlays = 0
    }

    // Animate the numbers
    updateAnimations()
  } catch (error) {
    console.error("Error loading stats:", error)
  } finally {
    loading.value = false
  }
}

function formatListeningTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function formatStorage(bytes) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.stats-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeIn 0.6s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stats-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 2rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  position: relative;
  background: var(--side-nav-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: slideUp 0.6s ease both;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: 0 8px 24px rgba(142, 68, 173, 0.2);
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: var(--hover-bg);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 30px;
  height: 30px;
  color: var(--accent);
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon svg {
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
  margin-bottom: 0.5rem;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 0.95rem;
  color: var(--muted-text);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-sparkle {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle,
    rgba(142, 68, 173, 0.15) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.stat-card:hover .stat-sparkle {
  opacity: 1;
  animation: sparkle 2s infinite;
}

@keyframes sparkle {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.5) rotate(180deg);
    opacity: 0.6;
  }
}

/* Info Section */
.info-section {
  margin-top: 3rem;
  animation: fadeIn 0.8s ease 0.3s both;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.info-card {
  background: var(--side-nav-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.info-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(142, 68, 173, 0.15);
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.info-icon {
  font-size: 1.5rem;
}

.info-title {
  font-size: 0.9rem;
  color: var(--muted-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.info-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.info-sub {
  font-size: 0.9rem;
  color: var(--muted-text);
}

/* Refresh Button */
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 3rem auto 0;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(142, 68, 173, 0.3);
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(142, 68, 173, 0.4);
}

.refresh-btn:active:not(:disabled) {
  transform: translateY(0);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn svg {
  width: 20px;
  height: 20px;
}

.refresh-btn svg.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .stats-container {
    padding: 1rem;
  }

  .stats-title {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-card {
    padding: 1.5rem;
  }

  .stat-value {
    font-size: 2rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .top-lists-section {
    grid-template-columns: 1fr;
  }

  .track-name {
    font-size: 0.95rem;
  }

  .play-count {
    font-size: 0.85rem;
  }
}

/* Top Lists Section */
.top-lists-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.top-list {
  animation: fadeIn 0.8s ease 0.5s both;
}

.title-icon {
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

.top-list-container {
  background: var(--side-nav-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1rem;
  max-height: 600px;
  overflow-y: auto;
}

.top-list-container::-webkit-scrollbar {
  width: 8px;
}

.top-list-container::-webkit-scrollbar-track {
  background: var(--bg-color);
  border-radius: 4px;
}

.top-list-container::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.top-list-container::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: var(--muted-text);
}

.empty-state p {
  font-size: 1rem;
  line-height: 1.6;
}

.top-list-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-color);
  border-radius: 8px;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
  animation: slideInLeft 0.4s ease both;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.top-list-item:hover {
  background: var(--hover-bg);
  transform: translateX(4px);
  border-left: 3px solid var(--accent);
}

.rank {
  font-weight: 600;
  font-size: 1rem;
  color: var(--muted-text);
  width: 24px;
  text-align: right;
  margin-right: 0.5rem;
}

.top-list-item:nth-child(1) {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.15), transparent 80%);
}

.top-list-item:nth-child(2) {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--text-color) 10%, rgba(192, 192, 192, 0.25)),
    transparent 85%
  );
}

.top-list-item:nth-child(3) {
  background: linear-gradient(90deg, rgba(205, 127, 50, 0.15), transparent 80%);
}

.track-cover,
.track-cover-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  flex-shrink: 0;
  object-fit: cover;
}

.track-cover-placeholder {
  background: var(--hover-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.track-cover-placeholder svg {
  width: 24px;
  height: 24px;
}

.artist-avatar,
.artist-cover {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}

.artist-avatar {
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 700;
}

.track-info {
  flex: 1;
  min-width: 0;
}

.track-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.25rem;
}

.track-artist {
  font-size: 0.85rem;
  color: var(--muted-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.play-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent);
  flex-shrink: 0;
}

.play-count svg {
  opacity: 0.7;
}
</style>
