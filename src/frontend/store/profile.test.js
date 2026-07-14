import { describe, it, expect, beforeEach, vi } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { useProfileStore } from "./profile.js"

describe("useProfileStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe("load", () => {
    it("populates username and avatarUrl from window.api.profile.get", async () => {
      window.api.profile.get.mockResolvedValue({
        username: "royal",
        avatarUrl: "echovault:///avatar.png",
      })
      const store = useProfileStore()
      await store.load()
      expect(store.username).toBe("royal")
      expect(store.avatarUrl).toBe("echovault:///avatar.png")
    })

    it("defaults username to an empty string when none is stored", async () => {
      window.api.profile.get.mockResolvedValue({ username: null, avatarUrl: null })
      const store = useProfileStore()
      await store.load()
      expect(store.username).toBe("")
    })
  })

  describe("setUsername", () => {
    it("trims and stores the username", async () => {
      window.api.profile.setUsername.mockResolvedValue(undefined)
      const store = useProfileStore()
      await store.setUsername("  Royal  ")
      expect(store.username).toBe("Royal")
      expect(window.api.profile.setUsername).toHaveBeenCalledWith("Royal")
    })
  })

  describe("pickAvatar", () => {
    it("updates avatarUrl when the dialog returns a path", async () => {
      window.api.profile.pickAvatar.mockResolvedValue({
        avatarUrl: "echovault:///new.png",
      })
      const store = useProfileStore()
      await store.pickAvatar()
      expect(store.avatarUrl).toBe("echovault:///new.png")
    })

    it("leaves avatarUrl untouched when the dialog is canceled", async () => {
      window.api.profile.pickAvatar.mockResolvedValue({ avatarUrl: null })
      const store = useProfileStore()
      store.avatarUrl = "echovault:///existing.png"
      await store.pickAvatar()
      expect(store.avatarUrl).toBe("echovault:///existing.png")
    })
  })

  describe("clearAvatar", () => {
    it("clears avatarUrl and calls the IPC handler", async () => {
      window.api.profile.clearAvatar.mockResolvedValue(undefined)
      const store = useProfileStore()
      store.avatarUrl = "echovault:///existing.png"
      await store.clearAvatar()
      expect(store.avatarUrl).toBeNull()
      expect(window.api.profile.clearAvatar).toHaveBeenCalledOnce()
    })
  })
})
