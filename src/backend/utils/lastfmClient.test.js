import { describe, it, expect, afterEach, vi } from "vitest"
import crypto from "node:crypto"
import {
  buildSignature,
  getToken,
  getSession,
  updateNowPlaying,
  scrobble,
} from "./lastfmClient.js"

const credentials = { apiKey: "testkey", apiSecret: "testsecret" }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("buildSignature", () => {
  it("matches Last.fm's documented algorithm: sort keys, concat key+value pairs, append secret, MD5", () => {
    const params = { method: "auth.getsession", api_key: "testkey", token: "abc" }
    const expected = crypto
      .createHash("md5")
      .update("api_keytestkeymethodauth.getsessiontokenabctestsecret", "utf8")
      .digest("hex")
    expect(buildSignature(params, "testsecret")).toBe(expected)
  })
})

describe("getToken", () => {
  it("returns the token on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ token: "tok123" }) })),
    )
    const result = await getToken(credentials)
    expect(result.ok).toBe(true)
    expect(result.token).toBe("tok123")
  })

  it("surfaces a network error as a non-ok result instead of throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down")
      }),
    )
    const result = await getToken(credentials)
    expect(result.ok).toBe(false)
    expect(result.error).toBe("network down")
  })
})

describe("getSession", () => {
  it("returns sessionKey and username on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ session: { key: "sk123", name: "testuser" } }),
      })),
    )
    const result = await getSession(credentials, "tok123")
    expect(result.ok).toBe(true)
    expect(result.sessionKey).toBe("sk123")
    expect(result.username).toBe("testuser")
  })

  it("returns ok:false with the API's message on an unauthorized token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: 14, message: "Unauthorized Token" }),
      })),
    )
    const result = await getSession(credentials, "bad-token")
    expect(result.ok).toBe(false)
    expect(result.error).toBe("Unauthorized Token")
  })
})

describe("updateNowPlaying and scrobble", () => {
  it("POST signed params using the per-user credentials, not a shared app key", async () => {
    let capturedBody
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, opts) => {
        capturedBody = opts.body
        return { ok: true, json: async () => ({}) }
      }),
    )

    await updateNowPlaying(credentials, "sk123", { artist: "A", title: "B", duration: 200 })
    expect(capturedBody.toString()).toContain("method=track.updatenowplaying")
    expect(capturedBody.toString()).toContain("api_key=testkey")
    expect(capturedBody.toString()).toContain("sk=sk123")

    await scrobble(credentials, "sk123", { artist: "A", title: "B" }, 1700000000)
    expect(capturedBody.toString()).toContain("method=track.scrobble")
    expect(capturedBody.toString()).toContain("timestamp=1700000000")
  })
})
