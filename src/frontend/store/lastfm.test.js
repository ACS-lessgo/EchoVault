import { describe, it, expect, beforeEach, vi } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { useLastfmStore } from "./lastfm.js"

describe("useLastfmStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe("fetchStatus", () => {
    it("populates all status fields from window.api.lastfmGetStatus", async () => {
      window.api.lastfmGetStatus.mockResolvedValue({
        hasCredentials: true,
        connected: true,
        username: "royal",
        scrobblingEnabled: true,
      })
      const store = useLastfmStore()
      await store.fetchStatus()
      expect(store.hasCredentials).toBe(true)
      expect(store.connected).toBe(true)
      expect(store.username).toBe("royal")
      expect(store.scrobblingEnabled).toBe(true)
    })
  })

  describe("saveCredentials", () => {
    it("refreshes status on success", async () => {
      window.api.lastfmSaveCredentials.mockResolvedValue({ ok: true })
      window.api.lastfmGetStatus.mockResolvedValue({
        hasCredentials: true,
        connected: false,
        username: null,
        scrobblingEnabled: false,
      })
      const store = useLastfmStore()
      await store.saveCredentials("key", "secret")
      expect(window.api.lastfmSaveCredentials).toHaveBeenCalledWith("key", "secret")
      expect(store.hasCredentials).toBe(true)
      expect(store.error).toBeNull()
    })

    it("sets error and does not refresh status on failure", async () => {
      window.api.lastfmSaveCredentials.mockResolvedValue({ ok: false, error: "bad key" })
      const store = useLastfmStore()
      await store.saveCredentials("key", "secret")
      expect(store.error).toBe("bad key")
      expect(window.api.lastfmGetStatus).not.toHaveBeenCalled()
    })
  })

  describe("connect", () => {
    it("sets authPending on success", async () => {
      window.api.lastfmConnect.mockResolvedValue({ ok: true })
      const store = useLastfmStore()
      await store.connect()
      expect(store.authPending).toBe(true)
      expect(store.error).toBeNull()
    })

    it("sets error and leaves authPending false on failure", async () => {
      window.api.lastfmConnect.mockResolvedValue({ ok: false, error: "network error" })
      const store = useLastfmStore()
      await store.connect()
      expect(store.error).toBe("network error")
      expect(store.authPending).toBe(false)
    })
  })

  describe("confirmAuth", () => {
    it("clears authPending and refreshes status on success", async () => {
      window.api.lastfmConfirmAuth.mockResolvedValue({ ok: true })
      window.api.lastfmGetStatus.mockResolvedValue({
        hasCredentials: true,
        connected: true,
        username: "royal",
        scrobblingEnabled: false,
      })
      const store = useLastfmStore()
      store.authPending = true
      await store.confirmAuth()
      expect(store.authPending).toBe(false)
      expect(store.connected).toBe(true)
    })

    it("sets error and leaves authPending unchanged on failure", async () => {
      window.api.lastfmConfirmAuth.mockResolvedValue({ ok: false, error: "not confirmed" })
      const store = useLastfmStore()
      store.authPending = true
      await store.confirmAuth()
      expect(store.error).toBe("not confirmed")
      expect(store.authPending).toBe(true)
    })
  })

  describe("disconnect", () => {
    it("clears authPending and refreshes status", async () => {
      window.api.lastfmDisconnect.mockResolvedValue(undefined)
      window.api.lastfmGetStatus.mockResolvedValue({
        hasCredentials: true,
        connected: false,
        username: null,
        scrobblingEnabled: false,
      })
      const store = useLastfmStore()
      store.authPending = true
      await store.disconnect()
      expect(window.api.lastfmDisconnect).toHaveBeenCalledOnce()
      expect(store.authPending).toBe(false)
      expect(store.connected).toBe(false)
    })
  })

  describe("toggleEnabled", () => {
    it("flips scrobblingEnabled via the IPC call, then refreshes status", async () => {
      window.api.lastfmSetEnabled.mockResolvedValue(undefined)
      window.api.lastfmGetStatus.mockResolvedValue({
        hasCredentials: true,
        connected: true,
        username: "royal",
        scrobblingEnabled: true,
      })
      const store = useLastfmStore()
      store.scrobblingEnabled = false
      await store.toggleEnabled()
      expect(window.api.lastfmSetEnabled).toHaveBeenCalledWith(true)
      expect(store.scrobblingEnabled).toBe(true)
    })
  })
})
