import { describe, it, expect, beforeEach } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { useSearchStore } from "./search.js"

describe("useSearchStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("starts with an empty query", () => {
    const store = useSearchStore()
    expect(store.query).toBe("")
  })

  it("setQuery updates the query", () => {
    const store = useSearchStore()
    store.setQuery("daft punk")
    expect(store.query).toBe("daft punk")
  })
})
