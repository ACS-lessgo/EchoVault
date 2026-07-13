import { describe, it, expect, beforeEach } from "vitest"
import { createTestDb } from "../db/testDb.js"
import {
  getTracks,
  getRecentTracks,
  getLikedTracks,
  getEnhancedTracks,
  updateLike,
} from "./tracks.js"

let db

beforeEach(() => {
  db = createTestDb()
})

function insertTrack(overrides = {}) {
  const t = {
    file_path: `/music/${Math.random()}.mp3`,
    title: "Untitled",
    album: "",
    artist: "",
    isLiked: 0,
    isEnhanced: 0,
    ...overrides,
  }
  db.prepare(
    "INSERT INTO tracks (file_path, title, album, artist, isLiked, isEnhanced) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(t.file_path, t.title, t.album, t.artist, t.isLiked, t.isEnhanced)
}

describe("getTracks", () => {
  it("returns all tracks ordered by title", () => {
    insertTrack({ file_path: "/a", title: "Zebra" })
    insertTrack({ file_path: "/b", title: "Apple" })
    expect(getTracks(db).map((t) => t.title)).toEqual(["Apple", "Zebra"])
  })
})

describe("getRecentTracks", () => {
  it("returns at most 15 tracks, most recently inserted first", () => {
    for (let i = 0; i < 20; i++) insertTrack({ file_path: `/track${i}`, title: `Track ${i}` })
    const result = getRecentTracks(db)
    expect(result).toHaveLength(15)
    expect(result[0].title).toBe("Track 19")
  })
})

describe("getLikedTracks / getEnhancedTracks", () => {
  it("only returns tracks with the matching flag set", () => {
    insertTrack({ file_path: "/liked", title: "Liked", isLiked: 1 })
    insertTrack({ file_path: "/enhanced", title: "Enhanced", isEnhanced: 1 })
    insertTrack({ file_path: "/plain", title: "Plain" })

    expect(getLikedTracks(db).map((t) => t.title)).toEqual(["Liked"])
    expect(getEnhancedTracks(db).map((t) => t.title)).toEqual(["Enhanced"])
  })
})

describe("updateLike", () => {
  it("sets isLiked and returns true when a row was changed", () => {
    insertTrack({ file_path: "/x", title: "X" })
    const trackId = db.prepare("SELECT id FROM tracks WHERE file_path = ?").get("/x").id

    const changed = updateLike(db, trackId, true)

    expect(changed).toBe(true)
    expect(db.prepare("SELECT isLiked FROM tracks WHERE id = ?").get(trackId).isLiked).toBe(1)
  })

  it("returns false when no matching track exists", () => {
    expect(updateLike(db, 9999, true)).toBe(false)
  })
})
