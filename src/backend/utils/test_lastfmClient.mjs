import assert from "node:assert/strict"
import crypto from "node:crypto"

const {
  buildSignature,
  getToken,
  getSession,
  updateNowPlaying,
  scrobble,
} = await import("./lastfmClient.js")

const credentials = { apiKey: "testkey", apiSecret: "testsecret" }
const originalFetch = global.fetch

// signature matches Last.fm's documented algorithm: sort keys, concat
// key+value pairs, append secret, MD5.
{
  const params = { method: "auth.getsession", api_key: "testkey", token: "abc" }
  const expected = crypto
    .createHash("md5")
    .update("api_keytestkeymethodauth.getsessiontokenabctestsecret", "utf8")
    .digest("hex")
  assert.equal(buildSignature(params, "testsecret"), expected)
}

// getToken success, signed with the caller's own credentials
{
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ token: "tok123" }),
  })
  const result = await getToken(credentials)
  assert.equal(result.ok, true)
  assert.equal(result.token, "tok123")
}

// getSession success
{
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ session: { key: "sk123", name: "testuser" } }),
  })
  const result = await getSession(credentials, "tok123")
  assert.equal(result.ok, true)
  assert.equal(result.sessionKey, "sk123")
  assert.equal(result.username, "testuser")
}

// getSession failure (unauthorized token)
{
  global.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: 14, message: "Unauthorized Token" }),
  })
  const result = await getSession(credentials, "bad-token")
  assert.equal(result.ok, false)
  assert.equal(result.error, "Unauthorized Token")
}

// updateNowPlaying / scrobble send POST with signed params, using the
// per-user credentials passed in rather than any shared app key
{
  let capturedBody
  global.fetch = async (url, opts) => {
    capturedBody = opts.body
    return { ok: true, json: async () => ({}) }
  }
  await updateNowPlaying(credentials, "sk123", { artist: "A", title: "B", duration: 200 })
  assert.ok(capturedBody.toString().includes("method=track.updatenowplaying"))
  assert.ok(capturedBody.toString().includes("api_key=testkey"))
  assert.ok(capturedBody.toString().includes("sk=sk123"))

  await scrobble(credentials, "sk123", { artist: "A", title: "B" }, 1700000000)
  assert.ok(capturedBody.toString().includes("method=track.scrobble"))
  assert.ok(capturedBody.toString().includes("timestamp=1700000000"))
}

// network error surfaces as a non-ok result, not a throw
{
  global.fetch = async () => {
    throw new Error("network down")
  }
  const result = await getToken(credentials)
  assert.equal(result.ok, false)
  assert.equal(result.error, "network down")
}

global.fetch = originalFetch
console.log("lastfmClient self-check passed")
