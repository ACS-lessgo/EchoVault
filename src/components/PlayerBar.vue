<template>
  <footer class="player-bar">
    <div class="song-info">
      <img
        v-if="player.currentTrack?.coverDataUrl"
        :src="player.currentTrack.coverDataUrl"
        alt="Album Art"
      />
      <img v-else src="../assests/images/default-cover.svg" alt="Album Art" />

      <div class="song-details">
        <p>{{ player.currentTrack?.title || "No track selected" }}</p>
        <small>{{ player.currentTrack?.artist || "" }}</small>
      </div>
    </div>

    <div class="controls">
      <button @click="playPreviousTrack" class="icon-btn">
        <img class="playbar-icon-class" :src="Previous" alt="Previous" />
      </button>
      <button @click="togglePlay" class="icon-btn">
        <img
          class="playbar-icon-class play-icon"
          :src="isPlaying ? Pause : Play"
          :alt="isPlaying ? 'Pause' : 'Play'"
        />
      </button>
      <button class="icon-btn">
        <img class="playbar-icon-class" :src="Next" alt="Next" />
      </button>
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
        class="volume-slider"
      />
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
} from "../assests/icons/icons"

const volume = ref(50)
const isPlaying = computed(() => player.isPlaying)
const player = usePlayerStore()

const playPreviousTrack = () => {
  console.log("playPreviousTrack")
}

const currentVolumeIcon = computed(() =>
  volume.value == 0 ? VolumeMute : Volume
)

watch(volume, (newVal) => {
  const slider = document.querySelector(".volume-slider")
  if (slider) {
    slider.style.setProperty("--range-progress", `${newVal}%`)
  }
})

const togglePlay = () => {
  player.togglePlay()
  console.log(
    player.isPlaying ? "Playing" : "Paused",
    " :: Track =>",
    player.currentTrack.title || "(no track)"
  )

  // TODO : IPC call
  // window.api.togglePlay(player.currentTrack)
}

const toggleMute = () => {
  volume.value = volume.value == 0 ? 50 : 0
}
</script>

<style scoped>
.player-bar {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  background-color: var(--footer-bg);
  border-top: 2px solid var(--border-color);
  color: var(--text-color);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.5);
}

.song-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
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
  justify-content: center;
  overflow: hidden;
}

.song-details p {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-details small {
  color: #aaa;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

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
  width: 24px;
  height: 24px;
  transform: scale(1.2);
}

/* --- Volume section --- */
.volume {
  display: flex;
  align-items: center;
  gap: 8px;
}

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
