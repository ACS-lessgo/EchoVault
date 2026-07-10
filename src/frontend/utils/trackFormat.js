// Shared cover-art URL + duration formatting, extracted out of AllSongs.vue /
// Artists.vue's near-identical local copies so SearchResults.vue doesn't add a third.

export function attachCoverUrl(track) {
  if (!track?.cover) return { ...track, coverDataUrl: null }

  const url = track.cover.startsWith("/")
    ? `echovault://${track.cover}`
    : `echovault:///${track.cover}`

  return { ...track, coverDataUrl: url }
}

export function formatDurationVerbose(seconds) {
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
