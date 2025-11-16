<template>
  <div class="list-view">
    <table class="track-table">
      <thead>
        <tr>
          <th class="num-col">#</th>
          <th class="title-col">Title</th>
          <th class="album-col">Album</th>
          <th class="duration-col">Duration</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(track, index) in tracks"
          :key="track.id"
          class="track-row"
          :class="{
            playing: currentTrack?.file_path === track.file_path,
          }"
          @click="$emit('select', track)"
        >
          <td class="num-col">{{ index + 1 }}</td>

          <td class="title-col">
            <div class="track-info">
              <img
                v-if="track.coverDataUrl"
                :src="track.coverDataUrl"
                :alt="track.title"
                class="track-cover"
              />
              <img
                v-else
                src="../assets/images/default-cover.svg"
                :alt="track.title"
                class="track-cover"
              />
              <div class="track-details">
                <div class="track-title">{{ track.title }}</div>
                <div class="track-artist">{{ track.artist }}</div>
              </div>
            </div>
          </td>

          <td class="album-col">{{ track.album }}</td>
          <td class="duration-col">{{ formatDuration(track.duration) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  tracks: Array,
  currentTrack: Object,
  formatDuration: Function,
})

defineEmits(["select"])
</script>

<style scoped>
/* Track list table – used for displaying songs in list view */

/* List view container */
.list-view {
  width: 100%;
}

/* Table layout */
.track-table {
  width: 100%;
  border-collapse: collapse;
}

.track-table thead {
  border-bottom: 1px solid var(--border-color);
}

.track-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Column widths */
.num-col {
  width: 50px;
}

.title-col {
  width: 45%;
}

.album-col {
  width: 35%;
  text-align: left;
}

.duration-col {
  width: 100px;
  text-align: left;
}

/* Table rows */
.track-row {
  transition: background 0.2s;
  cursor: pointer;
}

.track-row td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* Track info layout */
.track-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.track-cover {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  object-fit: cover;
}

.track-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.track-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-color);
}

.track-artist {
  font-size: 13px;
  color: var(--muted-text);
}

/* Alternating row backgrounds */
.track-table tbody tr:nth-child(odd) {
  background-color: var(--side-nav-bg);
}

.track-table tbody tr:nth-child(even) {
  background-color: transparent;
}

/* Hover and active states */
.track-table tbody tr.track-row:hover {
  background: var(--hover-bg);
}

.track-row.playing {
  background: var(--hover-bg);
  transition: background 0.3s;
  box-shadow: inset 2px 0 0 var(--accent);
}

.track-card.playing {
  outline: 2px solid var(--accent);
  background: var(--hover-bg);
  transition: background 0.3s;
}
</style>
