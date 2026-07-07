import crypto from "node:crypto"
import fs from "node:fs"

const API_ENDPOINT = "https://ws.audioscrobbler.com/2.0/"
const TIMEOUT_MS = 5000
const MAX_QUEUE_SIZE = 50

export function buildSignature(params, secret) {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("")
  return crypto
    .createHash("md5")
    .update(sorted + secret, "utf8")
    .digest("hex")
}

async function request({ apiKey, apiSecret }, method, params, { httpMethod = "GET" } = {}) {
  const allParams = { ...params, method, api_key: apiKey }
  const api_sig = buildSignature(allParams, apiSecret)
  const body = new URLSearchParams({ ...allParams, api_sig, format: "json" })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response =
      httpMethod === "GET"
        ? await fetch(`${API_ENDPOINT}?${body}`, { signal: controller.signal })
        : await fetch(API_ENDPOINT, {
            method: "POST",
            body,
            signal: controller.signal,
          })

    const data = await response.json()
    if (!response.ok || data.error) {
      return { ok: false, error: data.message || `http-${response.status}` }
    }
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err.name === "AbortError" ? "timeout" : err.message }
  } finally {
    clearTimeout(timeout)
  }
}

export async function getToken(credentials) {
  const result = await request(credentials, "auth.gettoken", {})
  if (!result.ok) return result
  return { ok: true, token: result.data.token }
}

export function buildAuthUrl({ apiKey }, token) {
  return `https://www.last.fm/api/auth/?api_key=${apiKey}&token=${token}`
}

export async function getSession(credentials, token) {
  const result = await request(credentials, "auth.getsession", { token })
  if (!result.ok) return result
  return {
    ok: true,
    sessionKey: result.data.session.key,
    username: result.data.session.name,
  }
}

export async function updateNowPlaying(credentials, sessionKey, { artist, title, album, duration }) {
  const params = { artist, track: title, sk: sessionKey }
  if (album) params.album = album
  if (duration) params.duration = String(Math.round(duration))
  return request(credentials, "track.updatenowplaying", params, { httpMethod: "POST" })
}

export async function scrobble(credentials, sessionKey, { artist, title, album, duration }, timestamp) {
  const params = {
    artist,
    track: title,
    timestamp: String(timestamp),
    sk: sessionKey,
  }
  if (album) params.album = album
  if (duration) params.duration = String(Math.round(duration))
  return request(credentials, "track.scrobble", params, { httpMethod: "POST" })
}

// ponytail: local convenience queue, not a durable log — capped so an
// extended offline stretch can't grow this file unbounded. queuePath is
// passed in by the caller (main/lastfm.js knows the userData dir) so this
// module has no electron dependency and stays unit-testable under plain node.
function readQueue(queuePath) {
  try {
    return JSON.parse(fs.readFileSync(queuePath, "utf-8"))
  } catch {
    return []
  }
}

function writeQueue(queuePath, queue) {
  try {
    fs.writeFileSync(queuePath, JSON.stringify(queue))
  } catch (err) {
    console.error("lastfm :: failed to persist retry queue:", err)
  }
}

export function enqueueFailedScrobble(queuePath, credentials, sessionKey, track, timestamp) {
  const queue = readQueue(queuePath)
  queue.push({ credentials, sessionKey, track, timestamp })
  while (queue.length > MAX_QUEUE_SIZE) queue.shift()
  writeQueue(queuePath, queue)
}

export async function flushQueue(queuePath) {
  const queue = readQueue(queuePath)
  if (queue.length === 0) return

  const remaining = []
  for (const entry of queue) {
    const result = await scrobble(entry.credentials, entry.sessionKey, entry.track, entry.timestamp)
    if (!result.ok) remaining.push(entry)
  }
  writeQueue(queuePath, remaining)
}
