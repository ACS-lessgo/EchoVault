<template>
  <transition name="fade-slide">
    <div v-if="showMiniPlayer" class="mini-player-overlay">
      <!-- Falling Stars Background -->
      <div class="stars-container">
        <div v-for="n in 50" :key="n" class="star" :style="getStarStyle(n)"></div>
      </div>
      
      <div class="mini-player">
        <!-- Header -->
        <div class="mini-header">
          <button
            class="icon-btn"
            @click="exitMiniPlayer"
            title="Exit Mini Player"
          >
            <img :src="Playlist" alt="Exit Mini Player" class="icon" />
          </button>

          <span class="track-count">
            {{ currentIndex + 1 }}/{{ queueLength }}
          </span>

          <button class="icon-btn" @click="closeMiniPlayer" title="Close">
            <img :src="X" alt="Close" class="icon" />
          </button>
        </div>

        <!-- Album Art (Spinning) -->
        <div class="album-art-container">
          <div class="album-art" :class="{ spinning: player.isPlaying }">
            <img
              v-if="player.currentTrack?.coverDataUrl"
              :src="player.currentTrack.coverDataUrl"
              alt="Album Art"
            />
            <img
              v-else
              src="../assets/images/default-cover.svg"
              alt="Album Art"
            />
          </div>
        </div>

        <!-- Track Info -->
        <div class="track-info">
          <h2 class="track-title">
            {{ player.currentTrack?.title || "No track selected" }}
          </h2>
          <p class="track-artist">
            {{ player.currentTrack?.artist || "Unknown Artist" }}
          </p>
          <p class="track-album">{{ player.currentTrack?.album || "" }}</p>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section">
          <div
            class="progress-bar"
            @click="seek"
            @mousemove="showHoverTime"
            @mouseleave="hideHoverTime"
          >
            <div
              class="progress-fill"
              :style="{ width: `${player.progress * 100}%` }"
            ></div>
            <div
              class="progress-handle"
              :style="{ left: `${player.progress * 100}%` }"
            ></div>
            <div
              v-if="hoverTimeVisible"
              class="hover-time"
              :style="{ left: hoverX + 'px' }"
            >
              {{ formatTime(hoverTime) }}
            </div>
          </div>
          <div class="time-info">
            <span>{{ formatTime(player.currentTime) }}</span>
            <span>{{ formatTime(player.duration) }}</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="controls">
          <button
            @click="player.toggleShuffle"
            class="control-btn toggle-shuffle"
            :class="{ active: player.shuffleEnabled }"
            :title="player.shuffleEnabled ? 'Shuffle: On' : 'Shuffle: Off'"
          >
            <img :src="Shuffle" alt="Shuffle icon" class="icon" />
          </button>

          <button
            class="control-btn"
            @click="player.playPrevious"
            :disabled="!player.hasPrevious"
            title="Previous"
          >
            <img :src="Previous" alt="Previous" class="icon" />
          </button>

          <button
            class="control-btn play-btn"
            @click="player.togglePlay"
            title="Play/Pause"
          >
            <img
              :src="player.isPlaying ? Pause : Play"
              alt="Play/Pause"
              class="icon large"
            />
          </button>

          <button
            class="control-btn"
            @click="player.playNext"
            :disabled="!player.hasNext"
            title="Next"
          >
            <img :src="Next" alt="Next" class="icon" />
          </button>

          <button
            class="control-btn"
            @click="player.toggleRepeat"
            :class="{ active: player.repeatMode !== 'off' }"
            title="Repeat"
            disabled
          >
            <img
              :src="player.repeatMode === 'one' ? RepeatOne : Repeat"
              alt="Repeat"
              class="icon"
            />
          </button>
        </div>

        <!-- Volume -->
        <div class="volume-section">
          <button class="icon-btn" @click="toggleMute">
            <img :src="volumeIconComponent" alt="Volume" class="icon" />
          </button>

          <input
            type="range"
            min="0"
            max="100"
            v-model="volume"
            @input="onVolumeChange"
            class="volume-slider"
            :style="{ '--volume-progress': volume + '%' }"
          />
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { usePlayerStore } from "../store/player.js"
import {
  Previous,
  Next,
  Play,
  Volume,
  VolumeMute,
  Pause,
  Shuffle,
  Repeat,
  RepeatOne,
  Playlist,
  X,
} from "../assets/icons/icons"

const player = usePlayerStore()
const showMiniPlayer = ref(false)
const volume = ref(50)
const hoverTimeVisible = ref(false)
const hoverTime = ref(0)
const hoverX = ref(0)
let resizingFromCode = false
let resizeTimeout = null
let isMiniActive = false

const currentIndex = computed(() => player.currentIndex)
const queueLength = computed(() => player.queue.length)

const volumeIcon = computed(() => {
  if (volume.value === 0) return "fas fa-volume-mute"
  if (volume.value < 50) return "fas fa-volume-down"
  return "fas fa-volume-up"
})

// generate random star styles
function getStarStyle(index) {
  const left = Math.random() * 100
  const animationDuration = 2 + Math.random() * 4 // 2-6 seconds
  const animationDelay = Math.random() * 5 // 0-5 seconds delay
  const size = 1 + Math.random() * 2 // 1-3px star size
  
  return {
    left: `${left}%`,
    animationDuration: `${animationDuration}s`,
    animationDelay: `${animationDelay}s`,
    width: `${size}px`,
    height: `${size}px`,
  }
}

// Check window size
function checkWindowSize() {
  if (resizingFromCode) return

  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    const width = window.innerWidth
    const height = window.innerHeight

    const miniThresholdW = 600
    const miniThresholdH = 700

    // Check if EITHER width OR height crosses threshold
    const shouldActivateMini = width < miniThresholdW || height < miniThresholdH
    const shouldDeactivateMini = width >= miniThresholdW && height >= miniThresholdH

    if (!isMiniActive && shouldActivateMini) {
      isMiniActive = true
      resizingFromCode = true
      showMiniPlayer.value = true
      window.api.enableMiniPlayer?.()
      setTimeout(() => (resizingFromCode = false), 600)
    } else if (isMiniActive && shouldDeactivateMini) {
      // Only deactivate if window is significantly larger to prevent bouncing
      const hasSignificantMargin = 
        width > miniThresholdW + 50 && height > miniThresholdH + 50
      
      if (hasSignificantMargin) {
        isMiniActive = false
        resizingFromCode = true
        showMiniPlayer.value = false
        window.api.restoreWindowSize?.()
        setTimeout(() => (resizingFromCode = false), 600)
      }
    }
  }, 250)
}

function exitMiniPlayer() {
  isMiniActive = false
  window.api.restoreWindowSize?.()
  showMiniPlayer.value = false
}

function closeMiniPlayer() {
  isMiniActive = false
  showMiniPlayer.value = false
  window.api.restoreWindowSize?.()
}

function toggleMute() {
  if (volume.value === 0) {
    volume.value = player.volume * 100 || 50
  } else {
    volume.value = 0
  }
  player.setVolume(volume.value / 100)
}

const volumeIconComponent = computed(() => {
  if (volume.value === 0) return VolumeMute
  return Volume
})

function onVolumeChange() {
  player.setVolume(volume.value / 100)
}

function formatTime(seconds) {
  if (!seconds) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function seek(event) {
  const bar = event.currentTarget
  const rect = bar.getBoundingClientRect()
  const ratio = (event.clientX - rect.left) / rect.width
  const targetTime = player.duration * Math.max(0, Math.min(1, ratio))
  player.seekTo(targetTime)
}

function showHoverTime(event) {
  const bar = event.currentTarget
  const rect = bar.getBoundingClientRect()
  const ratio = (event.clientX - rect.left) / rect.width
  hoverTime.value = player.duration * ratio
  hoverX.value = event.clientX - rect.left
  hoverTimeVisible.value = true
}

function hideHoverTime() {
  hoverTimeVisible.value = false
}

onMounted(() => {
  setTimeout(() => {
    checkWindowSize()
  }, 300)
  window.addEventListener("resize", checkWindowSize)
})

onUnmounted(() => {
  window.removeEventListener("resize", checkWindowSize)
})
</script>

<style scoped>
.mini-player-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
}

/* Falling Stars */
.stars-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.star {
  position: absolute;
  top: -10px;
  background: white;
  border-radius: 50%;
  opacity: 0;
  animation: fall linear infinite;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
}

@keyframes fall {
  0% {
    top: -10px;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    top: 100%;
    opacity: 0;
  }
}

.mini-player {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: scaleIn 0.3s ease;
  position: relative;
  z-index: 1;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Header */
.mini-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.5rem;
}

.track-count {
  font-size: 0.9rem;
  color: var(--muted-text);
  font-weight: 500;
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: var(--hover-bg);
  color: var(--accent);
}

.icon-btn i {
  font-size: 1rem;
}

.toggle-shuffle img {
  opacity: 0.7;
  transition:
    filter 0.2s ease,
    opacity 0.2s ease;
}

.toggle-shuffle.active img {
  filter: drop-shadow(0 0 4px var(--accent));
  opacity: 1;
}

/* Album Art */
.album-art-container {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.album-art {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  position: relative;
  transition: all 0.3s ease;
}

.album-art::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 50px;
  background: radial-gradient(circle, rgba(0, 0, 0, 0.8) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.album-art.spinning {
  animation: spin 15s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.album-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Track Info */
.track-info {
  text-align: center;
  padding: 0 1rem;
}

.track-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  font-size: 1rem;
  color: var(--muted-text);
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-album {
  font-size: 0.9rem;
  color: var(--muted-text);
  opacity: 0.7;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Progress Section */
.progress-section {
  padding: 0 1rem;
}

.progress-bar {
  position: relative;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-hover));
  border-radius: 3px;
  transition: width 0.1s linear;
}

.progress-handle {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.progress-bar:hover .progress-handle {
  opacity: 1;
}

.hover-time {
  position: absolute;
  bottom: 100%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  margin-bottom: 0.5rem;
  pointer-events: none;
}

.time-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--muted-text);
}

/* Controls */
.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0 1rem;
}

.control-btn {
  background: transparent;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover:not(:disabled) {
  background: var(--hover-bg);
  color: var(--accent);
  transform: scale(1.1);
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.control-btn.active {
  color: var(--accent);
}

.control-btn i {
  font-size: 1.2rem;
}

.play-btn {
  transform: scale(1.2);
  transition:
    transform 0.2s ease,
    filter 0.2s ease;
}

.play-btn:hover {
  transform: scale(1.3);
  filter: drop-shadow(0 0 5px white);
}

.play-btn i {
  font-size: 1.5rem;
}

/* Volume */
.volume-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1rem;
}

.volume-slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--accent) 0%,
    var(--accent) var(--volume-progress, 50%),
    rgba(255, 255, 255, 0.1) var(--volume-progress, 50%),
    rgba(255, 255, 255, 0.1) 100%
  );
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  transition: background 0.2s ease;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  transition: all 0.2s ease;
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  background: var(--accent-hover);
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.volume-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  background: var(--accent-hover);
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* icons */
.icon {
  width: 20px;
  height: 20px;
  color: var(--text-color);
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.icon.large {
  width: 28px;
  height: 28px;
}

.control-btn:hover .icon,
.icon-btn:hover .icon {
  color: var(--accent);
  transform: scale(1.1);
}

/* Responsive */
@media (max-width: 400px) {
  .album-art {
    width: 220px;
    height: 220px;
  }

  .track-title {
    font-size: 1.2rem;
  }

  .track-artist {
    font-size: 0.9rem;
  }
}
</style>