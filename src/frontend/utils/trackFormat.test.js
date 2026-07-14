import { describe, it, expect } from "vitest"
import { attachCoverUrl, formatDurationVerbose } from "./trackFormat.js"

describe("attachCoverUrl", () => {
  it("returns null coverDataUrl when the track has no cover", () => {
    expect(attachCoverUrl({ id: 1, cover: null })).toEqual({
      id: 1,
      cover: null,
      coverDataUrl: null,
    })
  })

  it("handles a nullish track", () => {
    expect(attachCoverUrl(null)).toEqual({ coverDataUrl: null })
  })

  it("builds an echovault:// url for an absolute cover path", () => {
    const result = attachCoverUrl({ id: 1, cover: "/covers/a.jpg" })
    expect(result.coverDataUrl).toBe("echovault:///covers/a.jpg")
  })

  it("builds an echovault:// url for a relative cover path", () => {
    const result = attachCoverUrl({ id: 1, cover: "covers/a.jpg" })
    expect(result.coverDataUrl).toBe("echovault:///covers/a.jpg")
  })
})

describe("formatDurationVerbose", () => {
  it("formats minutes and seconds together", () => {
    expect(formatDurationVerbose(125)).toBe("2 mins 5 secs")
  })

  it("uses singular labels for exactly 1 minute and 1 second", () => {
    expect(formatDurationVerbose(61)).toBe("1 min 1 sec")
  })

  it("omits seconds when the remainder is zero", () => {
    expect(formatDurationVerbose(120)).toBe("2 mins")
  })

  it("omits minutes when under a minute", () => {
    expect(formatDurationVerbose(45)).toBe("45 secs")
  })

  it("uses the singular label for exactly 1 second under a minute", () => {
    expect(formatDurationVerbose(1)).toBe("1 sec")
  })
})
