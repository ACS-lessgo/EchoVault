import { describe, it, expect, vi } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import crypto from "node:crypto"
import { sha256File, pctOf, isTransient, withRetry } from "./downloader.js"

describe("sha256File", () => {
  it("computes the sha256 hex digest of a file's contents", async () => {
    const tmpPath = path.join(os.tmpdir(), `echovault-sha256-test-${Date.now()}.txt`)
    fs.writeFileSync(tmpPath, "hello world")
    const expected = crypto.createHash("sha256").update("hello world").digest("hex")

    try {
      expect(await sha256File(tmpPath)).toBe(expected)
    } finally {
      fs.unlinkSync(tmpPath)
    }
  })
})

describe("pctOf", () => {
  it("returns null when total is falsy (indeterminate progress)", () => {
    expect(pctOf(50, 0)).toBeNull()
    expect(pctOf(50, undefined)).toBeNull()
  })

  it("computes a rounded percentage", () => {
    expect(pctOf(50, 200)).toBe(25)
    expect(pctOf(1, 3)).toBe(33)
  })

  it("clamps to 100 when done exceeds total", () => {
    expect(pctOf(150, 100)).toBe(100)
  })
})

describe("isTransient", () => {
  it("treats 404/408/429/5xx as transient", () => {
    expect(isTransient(new Error("download failed: HTTP 404 for x"))).toBe(true)
    expect(isTransient(new Error("download failed: HTTP 408 for x"))).toBe(true)
    expect(isTransient(new Error("download failed: HTTP 429 for x"))).toBe(true)
    expect(isTransient(new Error("download failed: HTTP 500 for x"))).toBe(true)
    expect(isTransient(new Error("download failed: HTTP 503 for x"))).toBe(true)
  })

  it("treats other HTTP status codes as non-transient", () => {
    expect(isTransient(new Error("download failed: HTTP 400 for x"))).toBe(false)
    expect(isTransient(new Error("download failed: HTTP 401 for x"))).toBe(false)
  })

  it("treats errors with no HTTP status (network/DNS/timeout) as transient", () => {
    expect(isTransient(new Error("socket hang up"))).toBe(true)
    expect(isTransient(new Error())).toBe(true)
  })
})

describe("withRetry", () => {
  it("returns the result on the first successful attempt", async () => {
    const fn = vi.fn().mockResolvedValue("ok")
    const result = await withRetry(fn, { attempts: 3, baseMs: 1 })
    expect(result).toBe("ok")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("retries on a transient failure and eventually succeeds", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error("HTTP 503")).mockResolvedValueOnce("ok")
    const result = await withRetry(fn, { attempts: 3, baseMs: 1 })
    expect(result).toBe("ok")
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("gives up after exhausting all attempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("HTTP 503"))
    await expect(withRetry(fn, { attempts: 2, baseMs: 1 })).rejects.toThrow("HTTP 503")
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("does not retry a non-transient failure", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("HTTP 400"))
    await expect(withRetry(fn, { attempts: 3, baseMs: 1 })).rejects.toThrow("HTTP 400")
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
