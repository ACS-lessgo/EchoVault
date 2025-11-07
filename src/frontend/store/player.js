import { defineStore } from "pinia"

let currentSource = null
const audioCtx = new AudioContext()

export const usePlayerStore = defineStore("player", {
  state: () => ({
    currentTrack: {},
    isPlaying: false,
    lyrics: null,
  }),
  actions: {
    async setTrack(track) {
      this.currentTrack = track
      this.isPlaying = true
      this.lyrics = null // Reset lyrics

      // Play track
      await this.playTrack(track.file_path)
    },
    async playTrack(filePath) {
      try {
        console.log("Playing track:", filePath)
        const arrayBuffer = await window.api.playTrack(filePath)
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

        if (currentSource) {
          console.log("Stopping previous track :: ", currentSource)
          currentSource.stop()
          currentSource.disconnect()
        }

        const source = audioCtx.createBufferSource()
        source.buffer = audioBuffer
        source.connect(audioCtx.destination)
        source.start(0)

        currentSource = source
        this.isPlaying = true
      } catch (err) {
        console.error("Error playing track:", err)
      }
    },
    async togglePlay() {
      if (!this.currentTrack?.file_path) return

      if (this.isPlaying) {
        await audioCtx.suspend()
        this.isPlaying = false
      } else {
        await audioCtx.resume()
        this.isPlaying = true
      }
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
