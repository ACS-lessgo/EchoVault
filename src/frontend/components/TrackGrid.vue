<template>
  <div class="grid-view">
    <div
      v-for="track in tracks"
      :key="track.id"
      class="track-card"
      :class="{ playing: currentTrack?.file_path === track.file_path }"
    >
      <div class="card-cover">
        <img
          v-if="track.coverDataUrl"
          :src="track.coverDataUrl"
          :alt="track.title"
        />
        <img
          v-else
          src="../assets/images/default-cover.svg"
          :alt="track.title"
        />

        <div class="play-overlay">
          <button class="play-btn" @click.stop="emit('select', track)">
            <i class="fas fa-play"></i>
          </button>
        </div>
      </div>

      <div class="card-info">
        <div class="card-title">{{ track.title }}</div>
        <div class="card-artist">{{ track.artist }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  tracks: {
    type: Array,
    required: true,
  },
  currentTrack: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(["select"])
</script>

<style scoped>
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

/* Individual track card */
.track-card {
  background: var(--side-nav-bg);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
  cursor: pointer;
}

.track-card:hover {
  background: var(--topbar-bg);
  transform: translateY(-4px);
}

/* Album art container */
.card-cover {
  position: relative;
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.card-cover img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

/* Play overlay (on hover) */
.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.track-card:hover .play-overlay {
  opacity: 1;
}

/* Play button inside overlay */
.play-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  color: var(--text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.play-btn:hover {
  background: var(--accent-hover);
  transform: scale(1.1);
}

/* Card info text */
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

/* Currently playing card (grid view) */
.track-card.playing {
  outline: 2px solid var(--accent);
  background: var(--hover-bg);
  transition: background 0.3s;
}
</style>
