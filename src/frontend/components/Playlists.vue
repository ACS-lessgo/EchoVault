<template>
  <div class="placeholder">
    <h2>{{ t('liked.title') }}</h2>
    <TrackList
      v-if="viewMode === 'list'"
      :tracks="filteredTracks"
      :currentTrack="player.currentTrack"
      :formatDuration="formatDuration"
      @select="playCurrentTrack"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue"
import { useSearchStore } from "../store/search.js"
import { usePlayerStore } from "../store/player.js"
import TrackList from "./TrackList.vue"
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const tracks = ref([])
const viewMode = ref("list")

const search = useSearchStore()
const player = usePlayerStore()

watch(() => player.likedUpdated, loadTracks)

async function loadTracks() {
  const result = await window.api.getLikedTracks()

  // For each track, load cover as Base64 and attach it
  const withCovers = await Promise.all(
    result.map(async (track) => {
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

  tracks.value = withCovers
}

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

onMounted(loadTracks)

const filteredTracks = computed(() => {
  const q = search.query?.trim().toLowerCase()
  if (!q) return tracks.value

  return tracks.value.filter((t) => {
    const title = t.title?.toLowerCase() || ""
    const artist = t.artist?.toLowerCase() || ""
    const album = t.album?.toLowerCase() || ""
    return title.includes(q) || artist.includes(q) || album.includes(q)
  })
})

// Send to store for Player component
function playCurrentTrack(track) {
  if (player.queueSource !== "liked") {
    player.clearQueue()
    player.queue = tracks.value.map((t) => ({ ...t }))
    player.queueSource = "liked"
  }

  const index = player.queue.findIndex((t) => t.file_path === track.file_path)
  if (index !== -1) {
    player.currentIndex = index
    player.setTrack(player.queue[index], false)
  } else {
    player.setTrack(track)
  }
}
</script>
