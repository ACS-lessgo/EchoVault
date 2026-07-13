import { describe, it, expect, vi, beforeEach } from "vitest"
import fs from "fs"
import { playTrack, getFileSize } from "./player.js"

vi.mock("fs", () => ({
  default: {
    readFileSync: vi.fn(),
    statSync: vi.fn(),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("playTrack", () => {
  it("returns an ArrayBuffer view of the file's bytes", () => {
    const buf = Buffer.from("hello world")
    fs.readFileSync.mockReturnValue(buf)

    const result = playTrack("/music/a.mp3")

    expect(fs.readFileSync).toHaveBeenCalledWith("/music/a.mp3")
    expect(Buffer.from(result).toString()).toBe("hello world")
  })

  it("logs and rethrows when the file can't be read", () => {
    fs.readFileSync.mockImplementation(() => {
      throw new Error("ENOENT")
    })

    expect(() => playTrack("/missing.mp3")).toThrow("ENOENT")
  })
})

describe("getFileSize", () => {
  it("returns the file size in bytes", () => {
    fs.statSync.mockReturnValue({ size: 12345 })

    expect(getFileSize("/music/a.mp3")).toBe(12345)
    expect(fs.statSync).toHaveBeenCalledWith("/music/a.mp3")
  })

  it("logs and rethrows when stat fails", () => {
    fs.statSync.mockImplementation(() => {
      throw new Error("ENOENT")
    })

    expect(() => getFileSize("/missing.mp3")).toThrow("ENOENT")
  })
})
