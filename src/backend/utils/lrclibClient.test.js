import { describe, it, expect, afterEach, vi } from "vitest"
import { fetchLyricsFromLrclib } from "./lrclibClient.js"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("fetchLyricsFromLrclib", () => {
  it("returns parsed lyrics on a successful match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ syncedLyrics: "[00:01.00]Hello\n[00:02.00]World" }),
      })),
    )
    const { lyrics, reason } = await fetchLyricsFromLrclib({ artist: "A", title: "B", duration: 120 })
    expect(reason).toBe("ok")
    expect(lyrics.timestamps).toEqual([
      { startTime: 1, text: "Hello", endTime: 2 },
      { startTime: 2, text: "World", endTime: Infinity },
    ])
  })

  it("returns http-404 when there is no match", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404 })))
    const { lyrics, reason } = await fetchLyricsFromLrclib({ artist: "A", title: "B" })
    expect(lyrics).toBeNull()
    expect(reason).toBe("http-404")
  })

  it("returns no-synced-lyrics for a 200 response without synced lyrics", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ plainLyrics: "text only, no sync" }),
      })),
    )
    const { lyrics, reason } = await fetchLyricsFromLrclib({ artist: "A", title: "B" })
    expect(lyrics).toBeNull()
    expect(reason).toBe("no-synced-lyrics")
  })

  it("retries without the album when an album-qualified lookup misses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        if (url.includes("album_name")) return { ok: false, status: 404 }
        return { ok: true, json: async () => ({ syncedLyrics: "[00:05.00]Retry hit" }) }
      }),
    )
    const { lyrics, reason } = await fetchLyricsFromLrclib({ artist: "A", title: "B", album: "Wrong Album" })
    expect(reason).toBe("ok")
    expect(lyrics.timestamps).toEqual([{ startTime: 5, text: "Retry hit", endTime: Infinity }])
  })

  it("returns http-404 when both the album-qualified and album-less lookups miss", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404 })))
    const { lyrics, reason } = await fetchLyricsFromLrclib({ artist: "A", title: "B", album: "Wrong Album" })
    expect(lyrics).toBeNull()
    expect(reason).toBe("http-404")
  })

  it("returns a network-error reason instead of throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down")
      }),
    )
    const { lyrics, reason } = await fetchLyricsFromLrclib({ artist: "A", title: "B" })
    expect(lyrics).toBeNull()
    expect(reason).toBe("network-error: network down")
  })
})
