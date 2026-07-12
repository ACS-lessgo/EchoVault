import { defineStore } from "pinia"
import { ref } from "vue"

export const DEFAULT_SHORTCUTS = {
  playPause: "Space",
  nextTrack: "Mod+ArrowRight",
  previousTrack: "Mod+ArrowLeft",
  seekForward: "ArrowRight",
  seekBackward: "ArrowLeft",
  volumeUp: "ArrowUp",
  volumeDown: "ArrowDown",
  muteToggle: "M",
  shuffleToggle: "S",
  repeatCycle: "R",
  focusSearch: "/",
  goToLibrary: "Mod+L",
}

function loadSaved() {
  try {
    const raw = localStorage.getItem("shortcuts")
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const useShortcutsStore = defineStore("shortcuts", () => {
  const keymap = ref({ ...DEFAULT_SHORTCUTS, ...loadSaved() })

  function persist() {
    localStorage.setItem("shortcuts", JSON.stringify(keymap.value))
  }

  function actionForCombo(combo) {
    return Object.keys(keymap.value).find((id) => keymap.value[id] === combo) ?? null
  }

  function setShortcut(actionId, combo, { force = false } = {}) {
    const existing = actionForCombo(combo)
    if (existing && existing !== actionId) {
      if (!force) return { ok: false, conflictAction: existing }
      keymap.value = { ...keymap.value, [existing]: null }
    }
    keymap.value = { ...keymap.value, [actionId]: combo }
    persist()
    return { ok: true }
  }

  function resetToDefaults() {
    keymap.value = { ...DEFAULT_SHORTCUTS }
    persist()
  }

  function resetOne(actionId) {
    keymap.value = { ...keymap.value, [actionId]: DEFAULT_SHORTCUTS[actionId] }
    persist()
  }

  return { keymap, actionForCombo, setShortcut, resetToDefaults, resetOne }
})
