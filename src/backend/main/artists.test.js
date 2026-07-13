import { describe, it, expect, beforeEach } from "vitest"
import { createTestDb } from "../db/testDb.js"
import { getArtists, getTracksByArtist } from "./artists.js"

let db

beforeEach(() => {
  db = createTestDb()
})

describe("getArtists", () => {
  it("returns artists ordered by name", () => {
    db.prepare("INSERT INTO artists (name) VALUES (?)").run("Zeta")
    db.prepare("INSERT INTO artists (name) VALUES (?)").run("Alpha")

    const result = getArtists(db)

    expect(result.map((a) => a.name)).toEqual(["Alpha", "Zeta"])
  })
})

describe("getTracksByArtist", () => {
  it("returns only that artist's tracks, ordered by album then title", () => {
    const artistId = db.prepare("INSERT INTO artists (name) VALUES (?)").run("Artist A").lastInsertRowid
    const otherArtistId = db.prepare("INSERT INTO artists (name) VALUES (?)").run("Artist B").lastInsertRowid

    db.prepare(
      "INSERT INTO tracks (artist_id, file_path, title, album, artist) VALUES (?, ?, ?, ?, ?)"
    ).run(artistId, "/music/b.mp3", "Song B", "Album 1", "Artist A")
    db.prepare(
      "INSERT INTO tracks (artist_id, file_path, title, album, artist) VALUES (?, ?, ?, ?, ?)"
    ).run(artistId, "/music/a.mp3", "Song A", "Album 1", "Artist A")
    db.prepare(
      "INSERT INTO tracks (artist_id, file_path, title, album, artist) VALUES (?, ?, ?, ?, ?)"
    ).run(otherArtistId, "/music/c.mp3", "Song C", "Album 1", "Artist B")

    const result = getTracksByArtist(db, artistId)

    expect(result.map((t) => t.title)).toEqual(["Song A", "Song B"])
    expect(result.every((t) => t.artist_id === artistId)).toBe(true)
  })
})
