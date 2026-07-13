import { describe, it, expect } from "vitest"
import path from "node:path"
import { enhancedOutputPath } from "./enhance.js"

describe("enhancedOutputPath", () => {
  it("appends _reconstructed and switches the extension to .flac", () => {
    expect(enhancedOutputPath("/music/song.mp3")).toBe(path.join("/music", "song_reconstructed.flac"))
  })

  it("works regardless of the source extension", () => {
    expect(enhancedOutputPath("/music/track.m4a")).toBe(path.join("/music", "track_reconstructed.flac"))
  })
})
