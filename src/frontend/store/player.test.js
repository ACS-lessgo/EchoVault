import { audioMocks } from "./player.audio-mocks.js"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { usePlayerStore } from "./player.js"

function track(overrides = {}) {
  return {
    id: 1,
    title: "Song",
    artist: "Artist",
    album: "Album",
    duration: 200,
    file_path: "/music/song.flac",
    ...overrides,
  }
}

describe("usePlayerStore", () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()

    const el = audioMocks.audioElements[0]
    el.src = ""
    el.currentTime = 0
    el.duration = NaN
    el.paused = true
    el.onended = null
    el.play.mockImplementation(() => {
      el.paused = false
      return Promise.resolve()
    })
    audioMocks.context.currentTime = 0
    audioMocks.context.state = "running"
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("getters", () => {
    it("hasNext/hasPrevious/queueLength reflect currentIndex and queue length", () => {
      const store = usePlayerStore()
      store.queue = [track({ file_path: "a" }), track({ file_path: "b" })]
      store.currentIndex = 0
      expect(store.hasNext).toBe(true)
      expect(store.hasPrevious).toBe(false)
      expect(store.queueLength).toBe(2)

      store.currentIndex = 1
      expect(store.hasNext).toBe(false)
      expect(store.hasPrevious).toBe(true)
    })
  })

  describe("setVolume / toggleMute", () => {
    it("clamps volume to [0,1] and applies a cubic taper to the gain node", () => {
      const store = usePlayerStore()
      store.setVolume(1.5)
      expect(store.volume).toBe(1)
      expect(audioMocks.gains[0].gain.value).toBeCloseTo(1)

      store.setVolume(0.5)
      expect(store.volume).toBe(0.5)
      expect(audioMocks.gains[0].gain.value).toBeCloseTo(0.125) // 0.5^3

      store.setVolume(-1)
      expect(store.volume).toBe(0)
      expect(audioMocks.gains[0].gain.value).toBe(0)
    })

    it("toggleMute remembers and restores the previous volume", () => {
      const store = usePlayerStore()
      store.setVolume(0.7)
      store.toggleMute()
      expect(store.volume).toBe(0)
      expect(store.previousVolume).toBe(0.7)

      store.toggleMute()
      expect(store.volume).toBe(0.7)
    })

    it("toggleMute falls back to 0.5 when there is no remembered volume", () => {
      const store = usePlayerStore()
      store.previousVolume = 0
      store.volume = 0
      store.toggleMute()
      expect(store.volume).toBe(0.5)
    })
  })

  describe("EQ", () => {
    it("setEQBand clamps, marks the preset Custom, persists, and pushes to the live filter when enabled", () => {
      const store = usePlayerStore()
      store.eqEnabled = true
      store.setEQBand(2, 20)
      expect(store.eqBands[2]).toBe(12)
      expect(store.eqPreset).toBe("Custom")
      expect(audioMocks.filters[2].gain.value).toBe(12)
      expect(JSON.parse(localStorage.getItem("eqBands"))[2]).toBe(12)
      expect(localStorage.getItem("eqPreset")).toBe("Custom")
    })

    it("setEQBand does not touch the live filter node when EQ is disabled", () => {
      const store = usePlayerStore()
      store.eqEnabled = false
      audioMocks.filters[3].gain.value = 0
      store.setEQBand(3, 8)
      expect(store.eqBands[3]).toBe(8)
      expect(audioMocks.filters[3].gain.value).toBe(0)
    })

    it("applyEQPreset loads a named preset into state and the live filters", () => {
      const store = usePlayerStore()
      store.eqEnabled = true
      store.applyEQPreset("Rock")
      expect(store.eqBands).toEqual([4, 3, 2, 0, -1, 0, 2, 3, 4, 4])
      expect(store.eqPreset).toBe("Rock")
      expect(audioMocks.filters[0].gain.value).toBe(4)
    })

    it("applyEQPreset is a no-op for an unknown preset name", () => {
      const store = usePlayerStore()
      const before = store.eqBands.slice()
      store.applyEQPreset("Nonexistent")
      expect(store.eqBands).toEqual(before)
      expect(store.eqPreset).not.toBe("Nonexistent")
    })

    it("setEQEnabled(false) zeroes every live filter, and re-enabling restores the band values", () => {
      const store = usePlayerStore()
      store.eqEnabled = true
      store.applyEQPreset("Rock")
      store.setEQEnabled(false)
      expect(audioMocks.filters[0].gain.value).toBe(0)

      store.setEQEnabled(true)
      expect(audioMocks.filters[0].gain.value).toBe(4)
    })
  })

  describe("normalization", () => {
    it("setNormalizationEnabled(false) pins the normalization gain back to unity", () => {
      const store = usePlayerStore()
      store.setNormalizationEnabled(false)
      expect(audioMocks.gains[1].gain.value).toBe(1.0)
      expect(localStorage.getItem("normalizationEnabled")).toBe("false")
    })

    it("setNormalizationEnabled(true) persists the flag", () => {
      const store = usePlayerStore()
      store.setNormalizationEnabled(true)
      expect(store.normalizationEnabled).toBe(true)
      expect(localStorage.getItem("normalizationEnabled")).toBe("true")
    })
  })

  describe("toggleShuffle", () => {
    it("builds a shuffled order and repositions currentIndex on the current track", () => {
      const store = usePlayerStore()
      store.queue = [track({ file_path: "a" }), track({ file_path: "b" }), track({ file_path: "c" })]
      store.currentTrack = track({ file_path: "b" })
      store.currentIndex = 1

      store.toggleShuffle()

      expect(store.shuffleEnabled).toBe(true)
      expect(store.originalOrder).toEqual([0, 1, 2])
      expect(store.shuffleOrder).toHaveLength(3)
      expect(new Set(store.shuffleOrder)).toEqual(new Set([0, 1, 2]))
      expect(store.queue[store.shuffleOrder[store.currentIndex]].file_path).toBe("b")
    })

    it("restores original-order positioning when toggled back off", () => {
      const store = usePlayerStore()
      store.queue = [track({ file_path: "a" }), track({ file_path: "b" }), track({ file_path: "c" })]
      store.currentTrack = track({ file_path: "c" })
      store.currentIndex = 0

      store.toggleShuffle() // on
      store.toggleShuffle() // off

      expect(store.shuffleEnabled).toBe(false)
      expect(store.shuffleOrder).toEqual([])
      expect(store.currentIndex).toBe(2) // "c"'s real index in queue
    })
  })

  describe("clearQueue / playFromQueue / removeFromQueue", () => {
    it("clearQueue empties the queue and resets currentIndex", () => {
      const store = usePlayerStore()
      store.queue = [track()]
      store.currentIndex = 0
      store.clearQueue()
      expect(store.queue).toEqual([])
      expect(store.currentIndex).toBe(0)
    })

    it("playFromQueue points currentIndex at the given track (unshuffled)", () => {
      const store = usePlayerStore()
      store.queue = [track({ file_path: "a" }), track({ file_path: "b" })]
      store.playFromQueue(track({ file_path: "b" }))
      expect(store.currentIndex).toBe(1)
    })

    it("playFromQueue resolves through shuffleOrder when shuffle is enabled", () => {
      const store = usePlayerStore()
      store.queue = [track({ file_path: "a" }), track({ file_path: "b" })]
      store.shuffleEnabled = true
      store.shuffleOrder = [1, 0]
      store.playFromQueue(track({ file_path: "a" }))
      expect(store.currentIndex).toBe(1) // position of queue-index 0 within shuffleOrder
    })

    it("removeFromQueue drops the track and shifts currentIndex back when needed", () => {
      const store = usePlayerStore()
      store.queue = [track({ file_path: "a" }), track({ file_path: "b" }), track({ file_path: "c" })]
      store.currentIndex = 2 // "c"
      store.removeFromQueue(track({ file_path: "a" }))
      expect(store.queue.map((t) => t.file_path)).toEqual(["b", "c"])
      expect(store.currentIndex).toBe(1) // still pointing at "c"
    })

    it("removeFromQueue clamps currentIndex when the last track is removed", () => {
      const store = usePlayerStore()
      store.queue = [track({ file_path: "a" }), track({ file_path: "b" })]
      store.currentIndex = 1
      store.removeFromQueue(track({ file_path: "b" }))
      expect(store.currentIndex).toBe(0)
    })
  })

  describe("setTrack / playTrack", () => {
    it("plays a new track: updates state, streams via the audio element, and fires IPC side effects", async () => {
      const store = usePlayerStore()
      audioMocks.audioElements[0].duration = 200
      const t = track()

      await store.setTrack(t)

      expect(store.currentTrack.file_path).toBe(t.file_path)
      expect(store.isPlaying).toBe(true)
      expect(store.queue).toHaveLength(1)
      expect(audioMocks.audioElements[0].src).toBe(
        `echovault-audio://local/${encodeURIComponent(t.file_path)}`
      )
      expect(audioMocks.audioElements[0].play).toHaveBeenCalledOnce()
      expect(window.api.updateTrayNowPlaying).toHaveBeenCalledWith(
        expect.objectContaining({ title: t.title, isPlaying: true })
      )
      expect(window.api.lastfmNowPlaying).toHaveBeenCalledWith(
        expect.objectContaining({ artist: t.artist, title: t.title })
      )
      expect(window.api.incrementPlayCount).toHaveBeenCalledWith(t.id)
    })

    it("reuses the existing queue slot instead of duplicating an already-queued track", async () => {
      const store = usePlayerStore()
      const t = track()
      await store.setTrack(t)
      await store.setTrack(t)
      expect(store.queue).toHaveLength(1)
      expect(store.currentIndex).toBe(0)
    })

    it("on playback failure: toasts an error and auto-advances (or stops if nothing next)", async () => {
      const store = usePlayerStore()
      audioMocks.audioElements[0].play.mockImplementationOnce(() =>
        Promise.reject(new Error("unsupported codec"))
      )

      await store.setTrack(track())

      expect(window.api.showToast).toHaveBeenCalledWith(
        expect.stringContaining("can't be played"),
        "error"
      )
      expect(store.isPlaying).toBe(false)
    })
  })

  describe("togglePlay", () => {
    it("does nothing without a current track", async () => {
      const store = usePlayerStore()
      await store.togglePlay()
      expect(audioMocks.audioElements[0].play).not.toHaveBeenCalled()
    })

    it("pauses when currently playing", async () => {
      const store = usePlayerStore()
      store.currentTrack = track()
      store.isPlaying = true
      await store.togglePlay()
      expect(audioMocks.audioElements[0].pause).toHaveBeenCalledOnce()
      expect(store.isPlaying).toBe(false)
      expect(window.api.updateTrayNowPlaying).toHaveBeenCalledWith(
        expect.objectContaining({ isPlaying: false })
      )
    })

    it("resumes an already-loaded src without re-invoking playTrack", async () => {
      const store = usePlayerStore()
      store.currentTrack = track()
      store.isPlaying = false
      audioMocks.audioElements[0].src = "echovault-audio://local/x"
      await store.togglePlay()
      expect(audioMocks.audioElements[0].play).toHaveBeenCalledOnce()
      expect(store.isPlaying).toBe(true)
    })
  })

  describe("seekTo", () => {
    it("does nothing without a current track", () => {
      const store = usePlayerStore()
      audioMocks.audioElements[0].duration = 200
      store.seekTo(50)
      expect(audioMocks.audioElements[0].currentTime).toBe(0)
    })

    it("does nothing when the audio element has no finite duration", () => {
      const store = usePlayerStore()
      store.currentTrack = track()
      audioMocks.audioElements[0].duration = NaN
      store.seekTo(50)
      expect(audioMocks.audioElements[0].currentTime).toBe(0)
    })

    it("clamps the target time to [0, duration] and updates progress", () => {
      const store = usePlayerStore()
      store.currentTrack = track()
      audioMocks.audioElements[0].duration = 200

      store.seekTo(-10)
      expect(audioMocks.audioElements[0].currentTime).toBe(0)

      store.seekTo(300)
      expect(audioMocks.audioElements[0].currentTime).toBe(200)
      expect(store.progress).toBe(1)

      store.seekTo(50)
      expect(store.currentTime).toBe(50)
      expect(store.progress).toBeCloseTo(0.25)
    })
  })

  describe("startProgressUpdater / scrobbling", () => {
    it("scrobbles once a track crosses the half-duration threshold, and only once", async () => {
      vi.useFakeTimers()
      const store = usePlayerStore()
      store.currentTrack = track({ duration: 100 })
      store.isPlaying = true
      audioMocks.audioElements[0].duration = 100
      audioMocks.audioElements[0].currentTime = 60 // past the 50s half-duration mark

      store.startProgressUpdater()
      await vi.advanceTimersByTimeAsync(200)

      expect(store.scrobbleSent).toBe(true)
      expect(window.api.lastfmScrobble).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(200)
      expect(window.api.lastfmScrobble).toHaveBeenCalledTimes(1)
    })

    it("does not scrobble tracks under 30 seconds", async () => {
      vi.useFakeTimers()
      const store = usePlayerStore()
      store.currentTrack = track({ duration: 20 })
      store.isPlaying = true
      audioMocks.audioElements[0].duration = 20
      audioMocks.audioElements[0].currentTime = 15

      store.startProgressUpdater()
      await vi.advanceTimersByTimeAsync(200)

      expect(window.api.lastfmScrobble).not.toHaveBeenCalled()
    })
  })

  describe("getLyrics", () => {
    it("stores fetched lyrics for the current track", async () => {
      const store = usePlayerStore()
      store.currentTrack = track()
      window.api.getLyrics.mockResolvedValue({ text: "la la la", source: "embedded", synchronized: false })
      await store.getLyrics()
      expect(store.lyrics).toEqual({ text: "la la la", source: "embedded", synchronized: false })
    })

    it("clears lyrics when the lookup fails", async () => {
      const store = usePlayerStore()
      store.currentTrack = track()
      store.lyrics = { text: "stale" }
      window.api.getLyrics.mockRejectedValue(new Error("network error"))
      await store.getLyrics()
      expect(store.lyrics).toBeNull()
    })

    it("does nothing without a current track", async () => {
      const store = usePlayerStore()
      store.currentTrack = {}
      await store.getLyrics()
      expect(window.api.getLyrics).not.toHaveBeenCalled()
    })
  })
})
