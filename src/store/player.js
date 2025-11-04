import { defineStore } from "pinia"

export const usePlayerStore = defineStore("player", {
  state: () => ({
    currentTrack: {},
    isPlaying: false,
    lyrics: null,
  }),
  actions: {
    setTrack(track) {
      this.currentTrack = track
      this.isPlaying = true
      this.lyrics = null // Reset lyrics
    },
    togglePlay() {
      this.isPlaying = !this.isPlaying
    },
    async getLyrics() {
      if (!this.currentTrack?.file_path) {
        console.warn("No track loaded cannot extract lyrics.")
        return
      }

      try {
        const lyrics = await window.api.getEmbeddedLyrics(
          this.currentTrack.file_path
        )
        this.lyrics = lyrics || "No lyrics found."
      } catch (err) {
        console.error("Failed to read lyrics:", err)
        this.lyrics = null
      }
    },
  },
})
