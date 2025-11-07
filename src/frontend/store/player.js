import { defineStore } from "pinia"

let currentSource = null
const audioCtx = new AudioContext()

export const usePlayerStore = defineStore("player", {
  state: () => ({
    currentTrack: {},
    isPlaying: false,
    lyrics: null,
    audioCache: new Map(), // last 10 tracks
    cacheStats: {
      hits: 0,
      misses: 0,
    },
    queue: [], // Track queue
    currentIndex: 0, // curr track index in queue
  }),
  actions: {
    async setTrack(track) {
      this.currentTrack = track
      this.lyrics = null // Reset lyrics
      this.isPlaying = true

      // Play track
      await this.playTrack(track.file_path)
    },

    async playTrack(filePath) {
      try {
        console.log("Playing track:", filePath)

        let audioBuffer

        // Check cache first
        if (this.audioCache.has(filePath)) {
          console.log("Loading from cache")
          audioBuffer = this.audioCache.get(filePath)
          this.cacheStats.hits++
          console.log(
            `Cache hit! (${this.cacheStats.hits} hits, ${this.cacheStats.misses} misses)`
          )
        } else {
          this.cacheStats.misses++
          console.log(
            `Cache miss! (${this.cacheStats.hits} hits, ${this.cacheStats.misses} misses)`
          )

          // Load from disk
          console.log("Loading from disk")

          // Get file size
          const fileSize = await window.api.getFileSize(filePath)
          console.log("File size:", fileSize, "bytes")

          // Stream file in chunks
          const chunkSize =
            fileSize > 10 * 1024 * 1024 ? 512 * 1024 : 256 * 1024
          const chunks = []
          let offset = 0

          while (offset < fileSize) {
            const size = Math.min(chunkSize, fileSize - offset)
            const chunk = await window.api.streamChunk(filePath, offset, size)
            chunks.push(chunk)
            offset += size
          }

          // Combine chunks
          const totalLength = chunks.reduce(
            (acc, chunk) => acc + chunk.byteLength,
            0
          )
          const combinedBuffer = new ArrayBuffer(totalLength)
          const combinedView = new Uint8Array(combinedBuffer)

          let position = 0
          for (const chunk of chunks) {
            combinedView.set(new Uint8Array(chunk), position)
            position += chunk.byteLength
          }

          // Decode audio
          console.log("Decoding audio buffer...")
          audioBuffer = await audioCtx.decodeAudioData(combinedBuffer)

          // Add to cache
          this.audioCache.set(filePath, audioBuffer)

          // Keep only last 10 tracks
          if (this.audioCache.size > 10) {
            const firstKey = this.audioCache.keys().next().value
            this.audioCache.delete(firstKey)
          }
        }

        // Stop previous track if playing
        if (currentSource) {
          console.log("Stopping previous track")
          try {
            currentSource.stop()
            currentSource.disconnect()
          } catch (e) {
            // Already stopped, ignore
          }
        }

        // Play new track
        const source = audioCtx.createBufferSource()
        source.buffer = audioBuffer
        source.connect(audioCtx.destination)
        source.start(0)

        currentSource = source
        this.isPlaying = true

        // Handle track end
        source.onended = () => {
          console.log("Track ended")

          if (this.hasNextInQueue()) {
            this.playNext()
          } else {
            this.isPlaying = false
            console.log("Queue finished")
          }
        }
      } catch (err) {
        console.error("Error playing track:", err)
        this.isPlaying = false
      }
    },

    playPrevious() {
      if (this.currentIndex > 0) {
        this.currentIndex--
        this.setTrack(this.queue[this.currentIndex])
        return true
      }
      return false
    },

    playNext() {
      if (this.currentIndex < this.queue.length - 1) {
        this.currentIndex++
        this.setTrack(this.queue[this.currentIndex])
        return true
      }
      return false
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
