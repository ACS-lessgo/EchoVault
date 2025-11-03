import { defineStore } from "pinia"

export const usePlayerStore = defineStore("player", {
  state: () => ({
    currentTrack: {},
    isPlaying: false,
  }),
  actions: {
    setTrack(track) {
      this.currentTrack = track
      this.isPlaying = true
    },
    togglePlay() {
      this.isPlaying = !this.isPlaying
    },
  },
})
