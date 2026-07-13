import { describe, it, expect, beforeEach } from "vitest"
import { createTestDb } from "../db/testDb.js"
import { searchTracks, searchArtists, searchGlobal } from "./search.js"

let db
let artistId

beforeEach(() => {
  db = createTestDb()
  artistId = db.prepare("INSERT INTO artists (name) VALUES (?)").run("The Beatles").lastInsertRowid
  db.prepare(
    "INSERT INTO tracks (artist_id, file_path, title, album, artist) VALUES (?, ?, ?, ?, ?)"
  ).run(artistId, "/music/help.mp3", "Help!", "Help!", "The Beatles")
  db.prepare(
    "INSERT INTO tracks (artist_id, file_path, title, album, artist) VALUES (?, ?, ?, ?, ?)"
  ).run(artistId, "/music/yesterday.mp3", "Yesterday", "1965", "The Beatles")
})

describe("searchTracks", () => {
  it("returns all tracks when the query is empty and no artist filter is given", () => {
    expect(searchTracks(db, "")).toHaveLength(2)
  })

  it("filters tracks by title/artist/album substring, case-insensitively", () => {
    expect(searchTracks(db, "YESTER").map((t) => t.title)).toEqual(["Yesterday"])
  })

  it("scopes to a single artist when artistId is provided with an empty query", () => {
    expect(searchTracks(db, { query: "", artistId })).toHaveLength(2)
  })

  it("combines an artist filter with a text query", () => {
    expect(searchTracks(db, { query: "help", artistId }).map((t) => t.title)).toEqual(["Help!"])
  })
})

describe("searchArtists", () => {
  it("returns all artists when the query is empty", () => {
    expect(searchArtists(db, "")).toHaveLength(1)
  })

  it("filters by name substring, case-insensitively", () => {
    expect(searchArtists(db, "beatles").map((a) => a.name)).toEqual(["The Beatles"])
    expect(searchArtists(db, "queen")).toEqual([])
  })
})

describe("searchGlobal", () => {
  it("returns empty buckets for an empty query", () => {
    expect(searchGlobal(db, "")).toEqual({ tracks: [], artists: [], playlists: [] })
  })

  it("returns matching tracks and artists together", () => {
    const result = searchGlobal(db, "beatles")
    expect(result.artists.map((a) => a.name)).toEqual(["The Beatles"])
    expect(result.tracks).toHaveLength(2)
    expect(result.playlists).toEqual([])
  })
})
