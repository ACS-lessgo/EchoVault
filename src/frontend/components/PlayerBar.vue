<template>
  <!-- === PROGRESS BAR === -->
  <div
    class="progress-bar"
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
        <button
          @click="togglePlayListQueueView"
          class="icon-btn"
          :title="`Show Queue`"
        >
          <img :src="Playlist" class="playbar-icon-class" alt="Playlist" />
        </button>
        <button @click="toggleLikedSong" class="icon-btn" :title="`Like Song`">
          <img
            class="playbar-icon-class"
            :src="player.currentTrack?.isLiked ? HeartSolid : Heart"
            alt="Heart icon"
          />
        </button>
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
      </div>

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
        />
      </div>
    </div>
  </footer>

  <!-- QUEUE SIDEBAR -->
  <transition name="slide-fade">
    <div v-if="showQueue" class="queue-panel">
      <div class="queue-header">
        <h3>
          Play Queue
          <small v-if="player.shuffleEnabled" style="opacity: 0.7"
            >(Shuffled)</small
          >
        </h3>
        <button class="close-btn" @click="togglePlayListQueueView">
          <img :src="X" alt="x" class="playbar-icon-class" />
        </button>
      </div>

      <div class="queue-list">
        <div
          v-for="(track, index) in displayedQueue"
          :key="track.id || index"
          class="queue-item"
          :class="{
            playing: player.currentTrack?.file_path === track.file_path,
          }"
          @click="playSongFromQueue(track, index)"
        >
          <div class="queue-info">
            <span class="index">{{ index + 1 }}</span>
            <div class="track-details">
              <div class="track-title">{{ track.title }}</div>
              <div class="track-artist">{{ track.artist }}</div>
            </div>
          </div>

          <span class="duration">{{ formatTime(track.duration) }}</span>

          <button
            class="remove-btn"
            title="Remove from queue"
            @click.stop="removeFromQueue(index)"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  </transition>
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
  Playlist,
  X,
} from "../assets/icons/icons"

import {
  formatTime,
  useVolumeControl,
  useProgressBar,
  usePlaybackControls,
  useQueueManagement,
  useTrackLike,
  getVolumeIcon,
} from "../utils/playerUtils.js"

const player = usePlayerStore()
const isPlaying = computed(() => player.isPlaying)
const showQueue = ref(false)

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
const { displayedQueue, playSongFromQueue, removeFromQueue } =
  useQueueManagement(player)
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

const togglePlayListQueueView = () => {
  showQueue.value = !showQueue.value
}
</script>

<style scoped>
/* Player bar and queue panel – includes playback controls, song info, volume, and queue list */

/* Player bar layout */
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
  color: var(--text-color);
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

/* Queue panel layout */
.queue-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 340px;
  height: calc(100vh - 86px);
  background-color: var(--content-bg);
  border-left: 2px solid var(--border-color);
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  z-index: 9999;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.5);
  border-bottom: 1px solid var(--border-color);
}

/* Queue header */
.queue-header {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--topbar-bg);
}

.queue-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

/* Queue header buttons */
.clear-btn,
.close-btn {
  background: transparent;
  border: none;
  color: var(--muted-text);
  font-size: 1.1rem;
  cursor: pointer;
  transition: color 0.2s ease;
}

.clear-btn:hover,
.close-btn:hover {
  color: var(--accent);
}

/* Queue list */
.queue-list {
  flex: 1;
  overflow-y: auto;
}

/* Queue item styles */
.queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
  position: relative;
  background-color: var(--side-nav-bg);
  border-bottom: 1px solid var(--border-color);
}

.queue-item:nth-child(odd) {
  background-color: var(--row-alt-bg);
}

.queue-item:nth-child(even) {
  background-color: var(--row-even-bg);
}

.queue-item:hover {
  background-color: var(--hover-bg);
}

.queue-item.playing {
  background-color: var(--accent-hover);
  color: #fff;
}

/* Queue item content */
.queue-info {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.queue-info .index {
  width: 20px;
  text-align: right;
  color: var(--muted-text);
  font-size: 0.85rem;
}

/* Track details inside queue */
.track-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.track-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  font-size: 13px;
  color: var(--muted-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Meta info (used in some queue variants) */
.meta {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  gap: 2px;
  overflow: hidden;
}

.title {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist {
  font-size: 0.8rem;
  color: var(--muted-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Duration text alignment */
.duration {
  font-size: 0.85rem;
  color: var(--muted-text);
  margin-left: auto;
  margin-right: 1.5rem;
}

/* Remove button inside queue item */
.remove-btn {
  opacity: 0;
  background: transparent;
  border: none;
  color: var(--muted-text);
  font-size: 1rem;
  position: absolute;
  right: 10px;
  transition:
    opacity 0.2s,
    color 0.2s;
  cursor: pointer;
}

.queue-item:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  color: var(--accent);
}

/* Queue transition animation */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Playback progress bar */
.progress-bar {
  position: fixed;
  bottom: 80px; /* above player bar */
  left: 0;
  right: 0;
  height: 6px;
  background: var(--border-color);
  cursor: pointer;
  z-index: 10000;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.1s linear;
}

.hover-time {
  position: absolute;
  bottom: 110%;
  background: var(--topbar-bg);
  color: var(--text-color);
  font-size: 0.7rem;
  padding: 2px 5px;
  border-radius: 4px;
  transform: translateX(-50%);
  pointer-events: none;
  white-space: nowrap;
  z-index: 10001;
}

/* Responsive queue panel adjustments */
@media (max-width: 768px) {
  .queue-panel {
    width: 100%;
    height: 60vh;
    bottom: 0;
    right: 0;
    top: auto;
    border-left: none;
    border-top: 2px solid var(--border-color);
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.4);
    animation: slideUp 0.3s ease;
  }

  .queue-header {
    padding: 0.8rem 1rem;
  }

  .queue-list {
    padding-bottom: 1rem;
  }

  .close-btn {
    font-size: 1.4rem;
    padding: 0.3rem 0.6rem;
  }
}

/* Slide-up animation for queue on mobile */
@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
