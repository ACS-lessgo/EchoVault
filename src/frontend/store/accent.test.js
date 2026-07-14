import { describe, it, expect, beforeEach } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { useAccentStore, accentColors } from "./accent.js"

describe("useAccentStore", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.style.removeProperty("--accent")
    document.documentElement.style.removeProperty("--accent-hover")
    document.documentElement.style.removeProperty("--hover-bg")
    setActivePinia(createPinia())
  })

  it("defaults to blue when nothing is stored", () => {
    const store = useAccentStore()
    expect(store.accentColor).toBe("#3498db")
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("#3498db")
  })

  it("initializes from localStorage when a color is stored", () => {
    localStorage.setItem("accentColor", "#e67e22")
    const store = useAccentStore()
    expect(store.accentColor).toBe("#e67e22")
  })

  it("setAccent updates state, localStorage, and CSS custom properties", () => {
    const store = useAccentStore()
    store.setAccent("#27ae60")
    expect(store.accentColor).toBe("#27ae60")
    expect(localStorage.getItem("accentColor")).toBe("#27ae60")
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("#27ae60")
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe(
      "rgb(44, 200, 110)"
    )
    expect(document.documentElement.style.getPropertyValue("--hover-bg")).toBe(
      "rgba(39, 174, 96, 0.2)"
    )
  })

  it("exposes the fixed accentColors palette", () => {
    expect(accentColors).toHaveLength(8)
    expect(accentColors.map((c) => c.key)).toContain("teal")
  })
})
