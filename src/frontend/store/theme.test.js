import { describe, it, expect, beforeEach, vi } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { useThemeStore } from "./theme.js"

describe("useThemeStore", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute("data-theme")
    setActivePinia(createPinia())
  })

  it("initializes from localStorage when a valid theme is stored", () => {
    localStorage.setItem("theme", "dark")
    const store = useThemeStore()
    expect(store.theme).toBe("dark")
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark")
  })

  it("falls back to system preference when nothing is stored", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })))
    const store = useThemeStore()
    expect(store.theme).toBe("dark")
    vi.unstubAllGlobals()
  })

  it("falls back to light when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined)
    const store = useThemeStore()
    expect(store.theme).toBe("light")
    vi.unstubAllGlobals()
  })

  it("setTheme updates state, localStorage, and the DOM attribute", () => {
    const store = useThemeStore()
    store.setTheme("dark")
    expect(store.theme).toBe("dark")
    expect(localStorage.getItem("theme")).toBe("dark")
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark")
  })

  it("toggleTheme flips between dark and light", () => {
    const store = useThemeStore()
    store.setTheme("light")
    store.toggleTheme()
    expect(store.theme).toBe("dark")
    store.toggleTheme()
    expect(store.theme).toBe("light")
  })
})
