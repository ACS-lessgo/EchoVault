import { describe, it, expect, beforeEach, vi } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { useUpdateStore } from "./update.js"

describe("useUpdateStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it("starts unchecked with no update available", () => {
    const store = useUpdateStore()
    expect(store.checked).toBe(false)
    expect(store.available).toBe(false)
    expect(store.version).toBe("")
    expect(store.url).toBe("")
  })

  describe("setResult", () => {
    it("marks checked and stores available/version/url", () => {
      const store = useUpdateStore()
      store.setResult({ available: true, version: "2.6.0", url: "https://example.com" })
      expect(store.checked).toBe(true)
      expect(store.available).toBe(true)
      expect(store.version).toBe("2.6.0")
      expect(store.url).toBe("https://example.com")
    })

    it("defaults version/url to empty strings and available to false for a falsy result", () => {
      const store = useUpdateStore()
      store.setResult(null)
      expect(store.checked).toBe(true)
      expect(store.available).toBe(false)
      expect(store.version).toBe("")
      expect(store.url).toBe("")
    })
  })

  describe("checkNow", () => {
    it("calls window.api.checkForUpdates and applies the result", async () => {
      window.api.checkForUpdates.mockResolvedValue({
        available: true,
        version: "2.6.0",
        url: "https://example.com/release",
      })
      const store = useUpdateStore()
      const result = await store.checkNow()
      expect(window.api.checkForUpdates).toHaveBeenCalledOnce()
      expect(result.available).toBe(true)
      expect(store.available).toBe(true)
      expect(store.version).toBe("2.6.0")
    })
  })
})
