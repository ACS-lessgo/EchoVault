// Canonical key-combo strings shared by the shortcut dispatcher (App.vue)
// and the rebind-capture UI (Setting.vue). "Mod" means Ctrl on Windows/Linux
// and Cmd on macOS, so one default keymap works cross-platform.

export function normalizeKeyEvent(e) {
  if (["Control", "Meta", "Shift", "Alt"].includes(e.key)) return null

  const parts = []
  if (e.ctrlKey || e.metaKey) parts.push("Mod")
  if (e.shiftKey) parts.push("Shift")
  if (e.altKey) parts.push("Alt")

  const key = e.key === " " ? "Space" : e.key.length === 1 ? e.key.toUpperCase() : e.key
  parts.push(key)
  return parts.join("+")
}

export function formatCombo(combo, isMac = window.api.platform === "darwin") {
  if (!combo) return ""
  return combo
    .replace("Mod", isMac ? "⌘" : "Ctrl")
    .replace("ArrowRight", "→")
    .replace("ArrowLeft", "←")
    .replace("ArrowUp", "↑")
    .replace("ArrowDown", "↓")
    .replaceAll("+", isMac ? "" : " + ")
}

export function isEditableTarget(el) {
  if (!el) return false
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable
}
