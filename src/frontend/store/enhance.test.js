import { describe, it, expect, beforeEach, vi } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { useEnhanceStore } from "./enhance.js"

describe("useEnhanceStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    window.api.onEnhanceProgress.mockImplementation(() => () => {})
  })

  it("starts with no progress and a zero completed count", () => {
    const store = useEnhanceStore()
    expect(store.progress).toEqual({})
    expect(store.completedCount).toBe(0)
  })

  describe("isEnhancing", () => {
    it("is false for a track with no in-flight progress", () => {
      const store = useEnhanceStore()
      expect(store.isEnhancing(1)).toBe(false)
    })
  })

  describe("enhance", () => {
    it("wires the progress listener and applies incoming events to state", async () => {
      let progressCallback
      window.api.onEnhanceProgress.mockImplementation((cb) => {
        progressCallback = cb
        return () => {}
      })
      window.api.enhanceTrack.mockImplementation(
        () => new Promise(() => {}) // never resolves, so we can inspect mid-flight state
      )
      const store = useEnhanceStore()
      store.enhance({ id: 1, title: "Song" })
      progressCallback({ trackId: 1, phase: "download", pct: 42, message: "Downloading" })
      expect(store.progress[1]).toEqual({ phase: "download", pct: 42, message: "Downloading" })
      expect(store.isEnhancing(1)).toBe(true)
    })

    it("does not start a second run for a track already enhancing", async () => {
      window.api.enhanceTrack.mockImplementation(() => new Promise(() => {}))
      const store = useEnhanceStore()
      store.enhance({ id: 1, title: "Song" })
      store.enhance({ id: 1, title: "Song" })
      expect(window.api.enhanceTrack).toHaveBeenCalledOnce()
    })

    it("on success: increments completedCount, toasts, and clears progress", async () => {
      window.api.enhanceTrack.mockResolvedValue({ success: true })
      const store = useEnhanceStore()
      await store.enhance({ id: 1, title: "Song" })
      expect(store.completedCount).toBe(1)
      expect(store.progress[1]).toBeUndefined()
      expect(window.api.showToast).toHaveBeenCalledWith('"Song" enhanced.', "success")
    })

    it("on cancel: stays silent and clears progress without incrementing completedCount", async () => {
      window.api.enhanceTrack.mockResolvedValue({ canceled: true })
      const store = useEnhanceStore()
      await store.enhance({ id: 1, title: "Song" })
      expect(store.completedCount).toBe(0)
      expect(store.progress[1]).toBeUndefined()
      expect(window.api.showToast).not.toHaveBeenCalled()
    })

    it("on error result: toasts the error message and clears progress", async () => {
      window.api.enhanceTrack.mockResolvedValue({ success: false, error: "Model missing" })
      const store = useEnhanceStore()
      await store.enhance({ id: 1, title: "Song" })
      expect(window.api.showToast).toHaveBeenCalledWith("Model missing", "error")
      expect(store.progress[1]).toBeUndefined()
    })

    it("on thrown error: toasts a generic failure, logs it, and clears progress", async () => {
      window.api.enhanceTrack.mockRejectedValue(new Error("subprocess crashed"))
      const store = useEnhanceStore()
      await store.enhance({ id: 1, title: "Song" })
      expect(window.api.showToast).toHaveBeenCalledWith(
        "Enhancement failed to start.",
        "error"
      )
      expect(window.api.error).toHaveBeenCalledWith(
        "enhance store :: subprocess crashed"
      )
      expect(store.progress[1]).toBeUndefined()
    })
  })
})
