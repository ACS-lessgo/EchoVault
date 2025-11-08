import { defineStore } from "pinia"

let currentSource = null
let currentAudioBuffer = null // Track the buffer
const audioCtx = new AudioContext({ sampleRate: 48000 })
const gainNode = audioCtx.createGain() // master gain for volume
gainNode.connect(audioCtx.destination)

export const usePlayerStore = defineStore("player", {
  state: () => ({
    currentTrack: {},
    isPlaying: false,
    lyrics: null,
    cacheStats: {
      hits: 0,
      misses: 0,
    },
    queue: [], // Track queue
    currentIndex: 0, // curr track index in queue
    volume: 0.5, // 0 - 1 , default 0.5
    likedUpdated: 0,
    repeatMode: "off", // 'off', 'all', 'one'
    shuffleEnabled: false,
    playHistory: [], // For smart shuffle
  }),
  getters: {
    hasNext: (state) => state.currentIndex < state.queue.length - 1,
    hasPrevious: (state) => state.currentIndex > 0,
    queueLength: (state) => state.queue.length,
  },
  actions: {
    async setTrack(track, addToQueue = true) {
      this.currentTrack = track
      this.lyrics = null // Reset lyrics
      this.isPlaying = true

      // Add to queue
      if (addToQueue) {
        const existingIndex = this.queue.findIndex(
          (t) => t.file_path === track.file_path
        )

        if (existingIndex === -1) {
          // add it
          this.queue.push(track)
          this.currentIndex = this.queue.length - 1
        } else {
          // just update index
          this.currentIndex = existingIndex
        }
      }

      // Play track
      await this.playTrack(track.file_path)
    },

    async playTrack(filePath) {
      // CRITICAL: Stop and clear previous track FIRST
      if (currentSource) {
        console.log("Stopping previous track")
        try {
          currentSource.onended = null
          currentSource.stop()
          currentSource.disconnect()
          currentSource.buffer = null
        } catch (e) {
          // Already stopped
        }
        currentSource = null
      }

      // Clear old buffer BEFORE loading new one
      if (currentAudioBuffer) {
        console.log("Clearing previous AudioBuffer")
        currentAudioBuffer = null
      }

      try {
        console.log("Playing track:", filePath)

        let audioBuffer

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
        
        // Store buffer reference for memory tracking
        currentAudioBuffer = audioBuffer

        // Stop previous track if playing
        if (currentSource) {
          console.log("Stopping previous track")
          try {
            // prevent auto-triggering of onended during manual stop
            currentSource.onended = null

            currentSource.stop()
            currentSource.disconnect()
          } catch (e) {
            // Already stopped, ignore
          }
        }

        // Play new track
        const source = audioCtx.createBufferSource()
        source.buffer = audioBuffer
        source.connect(gainNode)
        source.start(0)

        currentSource = source
        this.isPlaying = true

        // Handle track end
        source.onended = () => {
          console.log("Track ended")

          // Try to play next track
          const hasNext = this.playNext()

          // Only set to false if no next track
          if (!hasNext) {
            this.isPlaying = false
            console.log("Queue finished")
          }
        }
      } catch (err) {
        console.error("Error playing track:", err)
        this.isPlaying = false
      }
    },

    async playPrevious() {
      if (this.hasPrevious) {
        this.currentIndex--
        await this.setTrack(this.queue[this.currentIndex], false)
        return true
      }
      console.log("No previous track")
      return false
    },

    async playNext() {
      this.checkAudioMemory()
      if (this.hasNext) {
        this.currentIndex++
        await this.setTrack(this.queue[this.currentIndex], false)
        return true
      }
      console.log("No next track")
      return false
    },

    // Clear queue
    clearQueue() {
      this.queue = []
      this.currentIndex = 0
    },

    // Remove track from queue
    removeFromQueue(index) {
      if (index < 0 || index >= this.queue.length) return

      this.queue.splice(index, 1)

      // Adjust current index if needed
      if (this.currentIndex >= this.queue.length) {
        this.currentIndex = this.queue.length - 1
      } else if (index < this.currentIndex) {
        this.currentIndex--
      }
    },

    async togglePlay() {
      if (!this.currentTrack?.file_path) return

      // play - pause
      if (this.isPlaying) {
        await audioCtx.suspend()
        this.isPlaying = false
        return
      }

      // pause - play
      if (audioCtx.state === "suspended" && currentSource) {
        await audioCtx.resume()
        this.isPlaying = true
        return
      }

      // play new track
      if (!currentSource) {
        await this.playTrack(this.currentTrack.file_path)
        this.isPlaying = true
      }
    },

    setVolume(level) {
      this.volume = Math.max(0, Math.min(level, 1))
      gainNode.gain.setTargetAtTime(this.volume, audioCtx.currentTime, 0.01)
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

    // Play entire queue starting from index
    async playQueue(tracks, startIndex = 0) {
      if (!tracks || tracks.length === 0) return

      this.queue = [...tracks]
      this.currentIndex = startIndex
      await this.setTrack(this.queue[startIndex], false) // false = don't re-add to queue
    },

    notifyLikedChange() {
      this.likedUpdated++
    },

    toggleShuffle() {
      this.shuffleEnabled = !this.shuffleEnabled
    },

    toggleRepeat() {
      // Cycle: off -> all -> one -> off
      const modes = ["off", "all", "one"]
      const currentIdx = modes.indexOf(this.repeatMode)
      this.repeatMode = modes[(currentIdx + 1) % modes.length]
      console.log("Repeat mode:", this.repeatMode)
    },

    checkAudioMemory() {
      console.log('=== Audio Memory Check ===')
      
      // Check AudioContext state
      console.log('AudioContext state:', audioCtx.state)
      console.log('AudioContext sample rate:', audioCtx.sampleRate)
      console.log('AudioContext current time:', audioCtx.currentTime.toFixed(2), 's')
      
      // Check if source exists
      console.log('Current source exists:', !!currentSource)
      console.log('Current buffer exists:', !!currentAudioBuffer)
      
      // Estimate buffer size if exists
      if (currentAudioBuffer) {
        const channels = currentAudioBuffer.numberOfChannels
        const length = currentAudioBuffer.length
        const sampleRate = currentAudioBuffer.sampleRate
        const duration = currentAudioBuffer.duration
        
        // Each sample is 4 bytes (32-bit float)
        const sizeInBytes = channels * length * 4
        const sizeInMB = Math.round(sizeInBytes / 1024 / 1024)
        
        console.log('AudioBuffer details:')
        console.log('  Channels:', channels)
        console.log('  Length:', length.toLocaleString(), 'samples')
        console.log('  Sample rate:', sampleRate, 'Hz')
        console.log('  Duration:', Math.round(duration), 'seconds')
        console.log('  Estimated size:', sizeInMB, 'MB')
      }
      
      // Check performance memory
      if (performance.memory) {
        console.log('Performance memory:')
        console.log('  JS Heap Used:', Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), 'MB')
        console.log('  JS Heap Total:', Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), 'MB')
        console.log('  JS Heap Limit:', Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024), 'MB')
      }
      
      console.log('======================')
    }
  },
})