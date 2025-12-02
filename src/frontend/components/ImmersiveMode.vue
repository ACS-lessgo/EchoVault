<template>
  <div class="immersive-background">
    <img
      v-if="player.currentTrack?.coverDataUrl"
      :src="player.currentTrack.coverDataUrl"
      alt="Blurred Background Art"
      class="background-blur-img"
    />
  </div>

  <div class="exit-immersive-mode">
    <button
      class="icon-btn exit-btn"
      @click="closeImmersiveMode"
      title="Exit Immersive Mode"
    >
      <img :src="DesktopLyrics" class="playbar-icon-class" alt="Exit Icon" />
      <span>Exit</span>
    </button>
  </div>

  <div class="track-info-center">
    <div class="track-artwork parallax-wrapper">
      <img
        v-if="player.currentTrack?.coverDataUrl"
        :src="player.currentTrack.coverDataUrl"
        alt="Album Art"
        class="track-artwork-img parallax-img"
      />
      <img
        v-else
        src="../assets/images/default-cover.svg"
        alt="Album Art"
        class="track-artwork-img parallax-img"
      />
    </div>

    <h1 class="immersive-title">
      {{ player.currentTrack?.title || t("labels.unknownTrack") }}
    </h1>
    <h2 class="immersive-artist">
      {{ player.currentTrack?.artist || t("labels.unknownArtist") }}
    </h2>
  </div>

  <div class="immersive-playerbar">
    <div class="immersive-progress-container">
      <div
        class="progress-bar immersive-mode-progress"
        @click="seek($event)"
        @mousemove="showHoverTime($event)"
        @mouseleave="hideHoverTime"
      >
        <div
          class="progress-fill"
          :style="{ width: `${player.progress * 100}%` }"
        ></div>
        <div
          v-if="hoverTimeVisible"
          class="hover-time"
          :style="{ left: hoverX + 'px' }"
        >
          {{ formatTime(hoverTime) }}
        </div>
      </div>
      <div class="time-labels">
        <span class="current-time">{{ formatTime(player.currentTime) }}</span>
        <span class="duration">{{ formatTime(player.duration) }}</span>
      </div>
    </div>

    <footer class="player-bar immersive-controls-bar">
      <div class="track-utils">
        <button
          @click="player.toggleRepeat"
          class="icon-btn"
          :class="player.repeatMode"
          :title="`Repeat: ${player.repeatMode}`"
        >
          <img
            class="playbar-icon-class"
            :src="player.repeatMode === 'one' ? RepeatOne : Repeat"
            alt="Repeat icon"
          />
        </button>
        <button
          @click="player.toggleShuffle"
          class="icon-btn toggle-shuffle"
          :class="{ active: player.shuffleEnabled }"
          :title="player.shuffleEnabled ? 'Shuffle: On' : 'Shuffle: Off'"
        >
          <img class="playbar-icon-class" :src="Shuffle" alt="Shuffle icon" />
        </button>
        <button @click="toggleLikedSong" class="icon-btn" :title="`Like Song`">
          <img
            class="playbar-icon-class"
            :src="player.currentTrack?.isLiked ? HeartSolid : Heart"
            alt="Heart icon"
            :class="{ 'is-liked': player.currentTrack?.isLiked }"
          />
        </button>
      </div>
      <div class="controls">
        <button
          @click="playPreviousTrack"
          class="icon-btn prev-next-btn"
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
          class="icon-btn prev-next-btn"
          :disabled="!player.hasNext"
          :class="{ disabled: !player.hasNext }"
        >
          <img class="playbar-icon-class" :src="Next" alt="Next" />
        </button>
      </div>
      <div class="right-section">
        <div class="volume">
          <button
            @click="toggleMute"
            class="icon-btn"
            :title="`Volume: ${volume}%`"
          >
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
            :title="`Volume: ${volume}%`"
          />
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted } from "vue"
import { usePlayerStore } from "../store/player.js"
import { useRouter } from "vue-router"
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
  Playlist,
  DesktopLyrics,
} from "../assets/icons/icons" // Assuming icons are SVG/PNG/etc
import {
  formatTime,
  useVolumeControl,
  useProgressBar,
  usePlaybackControls,
  useTrackLike,
  getVolumeIcon,
} from "../utils/playerUtils.js" // Assuming these utility functions exist
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const emit = defineEmits(["toggle-queue", "close-immersive-mode"])
const props = defineProps({
  isInImmersiveMode: {
    type: Boolean,
    default: false,
  },
})

const player = usePlayerStore()
const isPlaying = computed(() => player.isPlaying)
const router = useRouter()

const { volume, onVolumeChange, toggleMute } = useVolumeControl(player)
const {
  hoverTimeVisible,
  hoverTime,
  hoverX,
  showHoverTime,
  hideHoverTime,
  seek,
} = useProgressBar(player)
const { togglePlay, playPreviousTrack, playNextTrack } =
  usePlaybackControls(player)
const { toggleLikedSong } = useTrackLike(player)

const currentVolumeIcon = computed(() =>
  getVolumeIcon(volume.value, { Volume, VolumeMute })
)

watch(volume, (newVal) => {
  const slider = document.querySelector(".volume-slider")
  if (slider) {
    slider.style.setProperty("--range-progress", `${newVal}%`)
  }
})

const closeImmersiveMode = () => emit("close-immersive-mode")

onMounted(() => {
  const wrapper = document.querySelector(".parallax-wrapper")
  const img = document.querySelector(".parallax-img")

  const handleMove = (e) => {
    const rect = wrapper.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2

    const rotateX = (y / rect.height) * -15
    const rotateY = (x / rect.width) * 15

    img.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(50px)`
  }

  wrapper.addEventListener("mousemove", handleMove)
  wrapper.addEventListener("mouseleave", () => {
    img.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(40px)"
  })
})
</script>

<style scoped>
/*TODO ::  CLean up the existing styles imported from playerbar.vue*/
/* --- BASE COMPONENT STYLES (Keep existing structure) --- */
/* Player bar – includes playback controls, song info, volume */

.draggable {
  height: 40px;
  width: 100%; /* Ensure it spans the full width */
  position: fixed; /* Fix it to the viewport */
  top: 0;
  left: 0;
  z-index: 9999; /* Put it above almost everything else */
  -webkit-app-region: drag;
}

/* Player bar layout */
.player-bar {
  height: 80px;
  display: grid;
  grid-template-columns: 1fr auto 1fr; /* Left | Center | Right */
  align-items: center;
  gap: 1rem;
  padding: 0 1rem;
  background-color: #1c1c1c;
  border-top: 2px solid #282828;
  color: #e5e5e5;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

/* Left section: song info */
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
  color: #e5e5e5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.3s ease;
  cursor: default;
}

/* Scrolling song title on hover */
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

/* Center section: playback controls */
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

/* Right section: utilities and volume */
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

/* Icon buttons */
.icon-btn {
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
}

.icon-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.icon-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* Volume slider */
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
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease;
}

/* Button states */
.icon-btn.active img {
  filter: brightness(1.3);
}

.icon-btn.off img {
  opacity: 0.6;
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

/* Icon theming by theme mode */
:root[data-theme="dark"] .playbar-icon-class {
  filter: invert(100%) brightness(200%);
}

:root[data-theme="light"] .playbar-icon-class {
  filter: invert(0%) brightness(0%);
}

/* Hover glow effect */
:root[data-theme="dark"] .icon-btn:hover img {
  filter: invert(100%) brightness(200%) drop-shadow(0 0 4px var(--accent-hover));
}

:root[data-theme="light"] .icon-btn:hover img {
  filter: invert(0%) brightness(0%) drop-shadow(0 0 3px var(--accent));
}

/* Playback progress bar */
.progress-bar {
  position: fixed;
  bottom: 80px; /* above player bar */
  left: 0;
  right: 0;
  height: 6px;
  background: #282828;
  cursor: pointer;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.1s linear;
}

.hover-time {
  position: absolute;
  bottom: 110%;
  background: #1c1c1c;
  color: #e5e5e5;
  font-size: 0.7rem;
  padding: 2px 5px;
  border-radius: 4px;
  transform: translateX(-50%);
  pointer-events: none;
  white-space: nowrap;
  z-index: 10001;
}

.artist-name {
  cursor: pointer;
  text-decoration: underline;
}

.artist-name:hover {
  opacity: 0.7;
}

/* General Theme Variables usage */
.player-bar {
  background-color: var(--footer-bg);
  border-top: 2px solid #282828;
  color: #e5e5e5;
}

.hover-time {
  background: #1c1c1c;
  color: #e5e5e5;
}

.artist-name {
  color: #a0a0a0;
}

.progress-bar {
  background: #282828;
}

/* Volume Slider logic with variables */
.volume-slider {
  background: linear-gradient(
    to right,
    #e5e5e5 0%,
    #e5e5e5 var(--range-progress, 50%),
    #282828 var(--range-progress, 50%),
    #282828 100%
  );
}

.volume-slider::-webkit-slider-thumb {
  background: #e5e5e5;
}

/* --- IMMERSIVE MODE STYLES (The Cool Factor) --- */

/* Full-screen blurred background */
.immersive-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  background-color: #121212; /* Fallback to theme BG */
  overflow: hidden;

  /* --- ANIMATION START: Color Cycle Base --- */
  background: linear-gradient(135deg, #121212, #2c3e50, var(--accent), #121212);
  background-size: 400% 400%;
  animation: colorCycle 5s ease infinite;
  will-change: background-position;
  /* --- ANIMATION END --- */
}

@keyframes colorCycle {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.background-blur-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(100px); /* Increased blur for better integration */
  transform: scale(1.2); /* Increased scale to cover animation edges */
  opacity: 0.9;
  transition: filter 0.5s ease;
  /* Make image dark in dark mode, light in light mode */
  :root:not([data-theme="light"]) & {
    filter: blur(100px) brightness(40%);
  }
  :root[data-theme="light"] & {
    filter: blur(100px) brightness(90%);
  }
}

/* Dark theme specific filter for background image */
:root:not([data-theme="light"]) .background-blur-img {
  filter: blur(80px) brightness(40%); /* Darken in dark mode */
}

/* Light theme specific filter for background image */
:root[data-theme="light"] .background-blur-img {
  filter: blur(80px) brightness(90%); /* Lighten/soften in light mode */
}

/* Exit Button Styling */
.exit-immersive-mode {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.exit-btn {
  /* Glassmorphism shell, using theme colors for transparency */
  background-color: var(--hover-bg);
  backdrop-filter: blur(10px);
  padding: 10px 15px;
  border-radius: 50px;
  color: #e5e5e5;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #282828;
  transition: all 0.2s ease;
}

.exit-btn:hover {
  background-color: var(--accent); /* Accent on hover */
  color: #fff;
}

/* Centered Track Info */
.track-info-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 90%;
  text-align: center;
  z-index: 10;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.5); /* Subtle text contrast */
  -webkit-app-region: no-drag;
}

.track-artwork-img {
  width: 350px !important;
  height: 350px !important;
  border-radius: 20px;
  /* Subtle 3D lift on hover */
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.8),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  -webkit-app-region: no-drag;
}

.track-artwork-img:hover {
  transform: scale(1.03) translateY(-5px); /* Lift and grow slightly */
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.9);
}

.immersive-title {
  font-size: 3.5rem;
  font-weight: 900;
  margin: 20px 0 5px;
  color: #e5e5e5;
  letter-spacing: -1px;
}

.immersive-artist {
  font-size: 1.8rem;
  font-weight: 500;
  color: #a0a0a0;
  opacity: 0.8;
  transition:
    color 0.2s ease,
    opacity 0.2s ease;
}

/* Immersive Player Bar (Controls at the bottom) */
.immersive-playerbar {
  /* Centering the player bar horizontally */
  position: fixed;
  bottom: 0;
  left: 50%; /* Start at 50% */
  transform: translateX(-50%); /* Shift back by half its width */
  width: 900px; /* Set a specific, clean width for centering */
  max-width: 95%; /* Prevent overflow on smaller screens */
  z-index: 9999;
  padding: 0 2rem 2rem;
  /* No-drag for controls */
  -webkit-app-region: no-drag;
}

/* Progress Bar Container */
.immersive-progress-container {
  padding: 0 20px;
}

/* Time Labels */
.time-labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 0.8rem;
  color: #a0a0a0;
  margin-top: 5px;
}

/* Progress Bar in Immersive Mode */
.progress-bar.immersive-mode-progress {
  position: relative;
  bottom: auto;
  left: auto;
  right: auto;
  height: 6px;
  background: #282828;
  border-radius: 4px;
}

.progress-fill {
  border-radius: 4px;
  background: var(--accent); /* Progress uses the accent color */
}

/* Immersive Controls Bar (Glassmorphism Effect) */
.player-bar.immersive-controls-bar {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(15px) brightness(80%); /* Increased blur */
  border: 1px solid rgba(255, 255, 255, 0.1); /* Lighter border */
  border-radius: 50px; /* Very rounded pill shape */
  height: 80px; /* Slightly shorter/sleeker */
  margin-top: 15px;
  padding: 0 40px;
  grid-template-columns: 1fr 1.5fr 1fr; /* Adjust grid for better balance */
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
}

:root[data-theme="light"] .player-bar.immersive-controls-bar {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px) brightness(100%);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

/* Center Controls */
.controls {
  gap: 20px;
}

.play-btn {
  transform: scale(1.5);
  filter: drop-shadow(0 0 5px var(--accent));
}

.play-btn:hover {
  transform: scale(1.6);
  filter: drop-shadow(0 0 8px var(--accent-hover));
}

.prev-next-btn {
  transform: scale(1.1);
}

/* Icon Button Enhancements (Theme-Aware) */
.icon-btn .playbar-icon-class {
  filter: invert(0%); /* Resetting default filter */
  opacity: 0.8;
  transition: opacity 0.2s;
}

:root:not([data-theme="light"]) .icon-btn .playbar-icon-class {
  filter: invert(100%) brightness(200%); /* White icons in dark mode */
}
:root[data-theme="light"] .icon-btn .playbar-icon-class {
  filter: invert(0%) brightness(0%); /* Black icons in light mode */
}

.icon-btn:hover .playbar-icon-class {
  opacity: 1;
}

/* Active/Special Icons */
.toggle-shuffle.active img,
.icon-btn img.is-liked {
  filter: none; /* Disable invert filter */
}

.toggle-shuffle.active img {
  filter: drop-shadow(0 0 4px var(--accent-hover));
  opacity: 1;
}
.icon-btn img.is-liked {
  fill: var(--accent); /* Heart solid color */
  filter: drop-shadow(0 0 4px var(--accent));
}

/* Hide the old song info, it's now in the center */
.song-info {
  display: none;
}

/* 3D Parallax Wrapper */
.parallax-wrapper {
  perspective: 1200px;
}

.parallax-img {
  transform-style: preserve-3d;
  transition: transform 0.15s ease;
  will-change: transform;
}
</style>
