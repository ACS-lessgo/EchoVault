import { defineStore } from "pinia"
import { ref, watch } from "vue"

export const useThemeStore = defineStore("theme", () => {
  // 'dark' | 'light'
  const theme = ref("light")

  function applyDomTheme(val) {
    document.documentElement.setAttribute("data-theme", val)
  }

  function setTheme(val) {
    theme.value = val
    localStorage.setItem("theme", val)
    applyDomTheme(val)
  }

  function toggleTheme() {
    const newTheme = theme.value === "dark" ? "light" : "dark"
    setTheme(newTheme)
  }

  // initialize from localStorage or system preference
  const saved = localStorage.getItem("theme")
  if (saved === "dark" || saved === "light") {
    theme.value = saved
    applyDomTheme(saved)
  } else {
    // fallback to system preference
    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)"
    )?.matches
    const initial = prefersDark ? "dark" : "light"
    theme.value = initial
    applyDomTheme(initial)
  }

  // keep DOM in sync if someone mutates theme externally
  watch(theme, (val) => {
    applyDomTheme(val)
  })

  return { theme, setTheme, toggleTheme }
})
