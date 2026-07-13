import { describe, it, expect } from "vitest"
import { initDB } from "./index.js"

describe("initDB", () => {
  it("opens an in-memory database and creates the schema when given an explicit path", () => {
    const db = initDB(":memory:")
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((t) => t.name)
    expect(tables).toEqual(
      expect.arrayContaining(["folders", "artists", "tracks", "playlists", "playlist_tracks"])
    )
    db.close()
  })

  it("enables foreign key enforcement", () => {
    const db = initDB(":memory:")
    expect(db.pragma("foreign_keys", { simple: true })).toBe(1)
    db.close()
  })
})
