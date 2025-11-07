<template>
  <footer class="player-bar">
    <!-- LEFT: Song Info -->
    <div class="song-info">
      <img
        v-if="player.currentTrack?.coverDataUrl"
        :src="player.currentTrack.coverDataUrl"
        alt="Album Art"
      />
      <img v-else src="../assets/images/default-cover.svg" alt="Album Art" />

      <div class="song-details">
        <p>{{ player.currentTrack?.title || "No track selected" }}</p>
        <small>{{ player.currentTrack?.artist || "" }}</small>
      </div>
    </div>

    <!-- CENTER: Controls -->
    <div class="controls">
      <button
        @click="playPreviousTrack"
        class="icon-btn"
        :disabled="!player.hasPrevious"
        :class="{ disabled: !player.hasPrevious }"
      >
        <img class="playbar-icon-class" :src="Previous" alt="Previous" />
      </button>

      <button @click="togglePlay" class="icon-btn play-btn">
        <img
          class="playbar-icon-class play-icon"
          :src="isPlaying ? Pause : Play"
          :alt="isPlaying ? 'Pause' : 'Play'"
        />
      </button>

      <button
        @click="playNextTrack"
        class="icon-btn"
        :disabled="!player.hasNext"
        :class="{ disabled: !player.hasNext }"
      >
        <img class="playbar-icon-class" :src="Next" alt="Next" />
      </button>
    </div>

    <!-- RIGHT: Track Utils + Volume -->
    <div class="right-section">
      <div class="track-utils">
        <button @click="toggleLikedSong" class="icon-btn">
          <img
            class="playbar-icon-class"
            :src="player.currentTrack?.isLiked ? HeartSolid : Heart"
            alt="Heart icon"
          />
        </button>
        <!-- TODO : Add Repeat and Shuffle -->
        <!-- <button @click="toggleRepeat" class="icon-btn">
          <img class="playbar-icon-class" :src="Repeat" alt="Heart icon" />
        </button>
        <button @click="toggleShuffle" class="icon-btn">
          <img
            class="playbar-icon-class"
            :src="Shuffle"
            alt="HeaShufflert icon"
          />
        </button> -->
      </div>

      <div class="volume">
        <button @click="toggleMute" class="icon-btn">
          <img
            class="playbar-icon-class"
            :src="currentVolumeIcon"
            alt="Volume icon"
          />
        </button>

        <input
          type="range"
          min="0"
          max="100"
          v-model="volume"
          @input="onVolumeChange"
          class="volume-slider"
        />
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed, watch } from "vue"
import { usePlayerStore } from "../store/player.js"
import {
  Previous,
  Next,
  Play,
  Volume,
  VolumeMute,
  Pause,
  Heart,
  HeartSolid,
  Shuffle,
  Repeat,
  RepeatOne,
} from "../assets/icons/icons"

const volume = ref(50)
const player = usePlayerStore()
const isPlaying = computed(() => player.isPlaying)

const currentVolumeIcon = computed(() =>
  volume.value === 0 ? VolumeMute : Volume
)

watch(volume, (newVal) => {
  const slider = document.querySelector(".volume-slider")
  if (slider) {
    slider.style.setProperty("--range-progress", `${newVal}%`)
  }
})

const togglePlay = async () => {
  await player.togglePlay()
}

const playPreviousTrack = async () => {
  if (!player.hasPrevious) return
  await player.playPrevious()
}

const playNextTrack = async () => {
  console.log("Checking next", player.hasNext)
  if (!player.hasNext) return
  await player.playNext()
}

const toggleLikedSong = async () => {
  const track = player.currentTrack
  if (!track?.id) return

  const newStatus = !track.isLiked

  // change the like status for UI
  track.isLiked = newStatus

  // send same to db
  await window.api.toggleLike(track.id, newStatus)
  console.log(`Track ${track.title} like status updated: ${newStatus}`)
}

const onVolumeChange = () => {
  player.setVolume(volume.value / 100)
}

const toggleMute = () => {
  if (volume.value === 0) {
    volume.value = player.volume * 100 || 50
  } else {
    volume.value = 0
  }
  player.setVolume(volume.value / 100)
}
</script>

<style scoped>
/* === PLAYER BAR LAYOUT === */
.player-bar {
  height: 80px;
  display: grid;
  grid-template-columns: 1fr auto 1fr; /* Left | Center | Right */
  align-items: center;
  gap: 1rem;
  padding: 0 1rem;
  background-color: var(--footer-bg);
  border-top: 2px solid var(--border-color);
  color: var(--text-color);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

/* === LEFT SECTION === */
.song-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  max-width: 320px;
  overflow: hidden;
}

.song-info img {
  flex-shrink: 0;
  width: 55px;
  height: 55px;
  border-radius: 8px;
  object-fit: cover;
}

.song-details {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.song-details p {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.3s ease;
  cursor: default;
}

/* 🎵 marquee scroll on hover */
.song-details p:hover {
  animation: scrollText 6s linear infinite;
}

@keyframes scrollText {
  0%,
  10% {
    transform: translateX(0);
  }
  90%,
  100% {
    transform: translateX(-60%);
  }
}

.song-details small {
  color: #aaa;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* === CENTER SECTION === */
.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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

/* === RIGHT SECTION === */
.right-section {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.track-utils {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* === ICONS === */
.icon-btn {
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.playbar-icon-class {
  width: 18px;
  height: 18px;
  filter: invert(100%) brightness(200%);
}

.play-icon {
  width: 26px;
  height: 26px;
}

/* === VOLUME SLIDER === */
.volume-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 120px;
  height: 4px;
  border-radius: 4px;
  background: linear-gradient(
    to right,
    white 0%,
    white var(--range-progress, 50%),
    #3a3a3a var(--range-progress, 50%),
    #3a3a3a 100%
  );
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease;
}
</style>
