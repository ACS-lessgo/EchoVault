import { describe, it, expect, beforeEach } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { useShortcutsStore, DEFAULT_SHORTCUTS } from "./shortcuts.js"

describe("useShortcutsStore", () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it("initializes with the default keymap when nothing is stored", () => {
    const store = useShortcutsStore()
    expect(store.keymap).toEqual(DEFAULT_SHORTCUTS)
  })

  it("merges saved overrides from localStorage on init", () => {
    localStorage.setItem("shortcuts", JSON.stringify({ playPause: "K" }))
    const store = useShortcutsStore()
    expect(store.keymap.playPause).toBe("K")
    expect(store.keymap.nextTrack).toBe(DEFAULT_SHORTCUTS.nextTrack)
  })

  it("ignores malformed saved shortcuts", () => {
    localStorage.setItem("shortcuts", "not json")
    const store = useShortcutsStore()
    expect(store.keymap).toEqual(DEFAULT_SHORTCUTS)
  })

  describe("actionForCombo", () => {
    it("returns the action id bound to a combo", () => {
      const store = useShortcutsStore()
      expect(store.actionForCombo("Space")).toBe("playPause")
    })

    it("returns null when no action is bound to the combo", () => {
      const store = useShortcutsStore()
      expect(store.actionForCombo("Mod+Z")).toBeNull()
    })
  })

  describe("setShortcut", () => {
    it("rebinds an action to a new combo and persists it", () => {
      const store = useShortcutsStore()
      const result = store.setShortcut("playPause", "K")
      expect(result).toEqual({ ok: true })
      expect(store.keymap.playPause).toBe("K")
      expect(JSON.parse(localStorage.getItem("shortcuts")).playPause).toBe("K")
    })

    it("refuses to rebind onto a combo already used by another action", () => {
      const store = useShortcutsStore()
      const result = store.setShortcut("volumeUp", "Space")
      expect(result).toEqual({ ok: false, conflictAction: "playPause" })
      expect(store.keymap.volumeUp).toBe(DEFAULT_SHORTCUTS.volumeUp)
    })

    it("force-rebinds and clears the conflicting action", () => {
      const store = useShortcutsStore()
      const result = store.setShortcut("volumeUp", "Space", { force: true })
      expect(result).toEqual({ ok: true })
      expect(store.keymap.volumeUp).toBe("Space")
      expect(store.keymap.playPause).toBeNull()
    })

    it("allows rebinding an action to the combo it already holds", () => {
      const store = useShortcutsStore()
      const result = store.setShortcut("playPause", "Space")
      expect(result).toEqual({ ok: true })
      expect(store.keymap.playPause).toBe("Space")
    })
  })

  it("resetToDefaults restores the full default keymap and persists it", () => {
    const store = useShortcutsStore()
    store.setShortcut("playPause", "K")
    store.resetToDefaults()
    expect(store.keymap).toEqual(DEFAULT_SHORTCUTS)
    expect(JSON.parse(localStorage.getItem("shortcuts"))).toEqual(DEFAULT_SHORTCUTS)
  })

  it("resetOne restores a single action's default binding", () => {
    const store = useShortcutsStore()
    store.setShortcut("playPause", "K")
    store.setShortcut("muteToggle", "X")
    store.resetOne("playPause")
    expect(store.keymap.playPause).toBe(DEFAULT_SHORTCUTS.playPause)
    expect(store.keymap.muteToggle).toBe("X")
  })
})
