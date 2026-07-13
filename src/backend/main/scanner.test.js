import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"
import { app } from "electron"
import { extractMetadata, scanFolder } from "./scanner.js"
import { createTestDb } from "../db/testDb.js"
import { parseAudioFile } from "../utils/audioMeta.js"

vi.mock("../utils/audioMeta.js", () => ({
  parseAudioFile: vi.fn(),
}))

let tmpDir

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "echovault-scanner-test-"))
  app.getPath.mockReturnValue(tmpDir)
  vi.clearAllMocks()
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe("extractMetadata", () => {
  it("returns title/artist/album/duration from the parsed tags", async () => {
    parseAudioFile.mockResolvedValue({
      common: { title: "Song", artist: "Artist", album: "Album" },
      format: { duration: 180 },
    })

    const result = await extractMetadata("/music/song.mp3")

    expect(result).toEqual({
      title: "Song",
      artist: "Artist",
      album: "Album",
      duration: 180,
      cover: null,
    })
  })

  it("falls back to the filename and 'Unknown' when tags are missing", async () => {
    parseAudioFile.mockResolvedValue({ common: {}, format: {} })

    const result = await extractMetadata("/music/untitled.mp3")

    expect(result).toEqual({
      title: "untitled.mp3",
      artist: "Unknown",
      album: "Unknown",
      duration: 0,
      cover: null,
    })
  })

  it("writes an embedded cover image to the covers dir and returns its path", async () => {
    parseAudioFile.mockResolvedValue({
      common: { title: "Song", picture: [{ data: Buffer.from("fake-jpeg-bytes") }] },
      format: { duration: 180 },
    })

    const result = await extractMetadata("/music/song.mp3")

    expect(result.cover).toBe(path.join(tmpDir, "covers", "song.mp3.jpg"))
    expect(fs.readFileSync(result.cover).toString()).toBe("fake-jpeg-bytes")
  })

  it("returns null when parsing the file throws", async () => {
    parseAudioFile.mockRejectedValue(new Error("corrupt file"))

    expect(await extractMetadata("/music/broken.mp3")).toBeNull()
  })
})

describe("scanFolder", () => {
  it("inserts a track for each audio file found in the folder", async () => {
    const musicDir = fs.mkdtempSync(path.join(os.tmpdir(), "echovault-scanner-music-"))
    fs.writeFileSync(path.join(musicDir, "a.mp3"), "")
    fs.writeFileSync(path.join(musicDir, "notes.txt"), "")

    parseAudioFile.mockResolvedValue({
      common: { title: "A", artist: "Artist A", album: "Album" },
      format: { duration: 100 },
    })

    const db = createTestDb()

    try {
      await scanFolder(db, musicDir)

      const tracks = db.prepare("SELECT title, artist FROM tracks").all()
      expect(tracks).toEqual([{ title: "A", artist: "Artist A" }])
    } finally {
      fs.rmSync(musicDir, { recursive: true, force: true })
    }
  })

  it("does not re-parse a file that's already in the db", async () => {
    const musicDir = fs.mkdtempSync(path.join(os.tmpdir(), "echovault-scanner-music-"))
    fs.writeFileSync(path.join(musicDir, "a.mp3"), "")

    parseAudioFile.mockResolvedValue({
      common: { title: "A", artist: "Artist A", album: "Album" },
      format: { duration: 100 },
    })

    const db = createTestDb()

    try {
      await scanFolder(db, musicDir)
      parseAudioFile.mockClear()
      await scanFolder(db, musicDir)

      expect(parseAudioFile).not.toHaveBeenCalled()
    } finally {
      fs.rmSync(musicDir, { recursive: true, force: true })
    }
  })
})
