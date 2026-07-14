import { describe, it, expect } from "vitest"
import { normalizeKeyEvent, formatCombo, isEditableTarget } from "./keyCombo.js"

describe("normalizeKeyEvent", () => {
  it("returns null for bare modifier key presses", () => {
    expect(normalizeKeyEvent({ key: "Control" })).toBeNull()
    expect(normalizeKeyEvent({ key: "Meta" })).toBeNull()
    expect(normalizeKeyEvent({ key: "Shift" })).toBeNull()
    expect(normalizeKeyEvent({ key: "Alt" })).toBeNull()
  })

  it("normalizes a plain single-character key to uppercase", () => {
    expect(normalizeKeyEvent({ key: "m" })).toBe("M")
  })

  it("maps space to the literal 'Space' token", () => {
    expect(normalizeKeyEvent({ key: " " })).toBe("Space")
  })

  it("prefixes Mod for ctrl or meta", () => {
    expect(normalizeKeyEvent({ key: "l", ctrlKey: true })).toBe("Mod+L")
    expect(normalizeKeyEvent({ key: "l", metaKey: true })).toBe("Mod+L")
  })

  it("combines multiple modifiers in a fixed order", () => {
    expect(
      normalizeKeyEvent({
        key: "ArrowRight",
        ctrlKey: true,
        shiftKey: true,
        altKey: true,
      })
    ).toBe("Mod+Shift+Alt+ArrowRight")
  })

  it("passes through multi-character non-modifier keys unchanged", () => {
    expect(normalizeKeyEvent({ key: "ArrowLeft" })).toBe("ArrowLeft")
  })
})

describe("formatCombo", () => {
  it("returns an empty string for a falsy combo", () => {
    expect(formatCombo(null)).toBe("")
    expect(formatCombo(undefined)).toBe("")
  })

  it("renders Mod as Ctrl and pads separators on non-mac", () => {
    expect(formatCombo("Mod+ArrowRight", false)).toBe("Ctrl + →")
  })

  it("renders Mod as the cmd glyph and drops separators on mac", () => {
    expect(formatCombo("Mod+ArrowRight", true)).toBe("⌘→")
  })

  it("translates all four arrow keys to glyphs", () => {
    expect(formatCombo("ArrowUp+ArrowDown+ArrowLeft+ArrowRight", false)).toBe(
      "↑ + ↓ + ← + →"
    )
  })
})

describe("isEditableTarget", () => {
  it("returns false for a null/undefined target", () => {
    expect(isEditableTarget(null)).toBe(false)
    expect(isEditableTarget(undefined)).toBe(false)
  })

  it("returns true for input and textarea elements", () => {
    expect(isEditableTarget(document.createElement("input"))).toBe(true)
    expect(isEditableTarget(document.createElement("textarea"))).toBe(true)
  })

  it("returns true for contentEditable elements", () => {
    const div = document.createElement("div")
    Object.defineProperty(div, "isContentEditable", { value: true })
    expect(isEditableTarget(div)).toBe(true)
  })

  it("returns falsy for a plain element", () => {
    expect(isEditableTarget(document.createElement("div"))).toBeFalsy()
  })
})
