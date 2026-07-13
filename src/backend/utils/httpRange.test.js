import { describe, it, expect } from "vitest"
import { parseRange } from "./httpRange.js"

describe("parseRange", () => {
  it("returns the full file (200) when there is no range header", () => {
    expect(parseRange(null, 1000)).toEqual({ status: 200, start: 0, end: 999 })
  })

  it("parses a bounded range", () => {
    expect(parseRange("bytes=100-199", 1000)).toEqual({ status: 206, start: 100, end: 199 })
  })

  it("defaults start to 0 when omitted", () => {
    expect(parseRange("bytes=-199", 1000)).toEqual({ status: 206, start: 0, end: 199 })
  })

  it("defaults end to the last byte when omitted", () => {
    expect(parseRange("bytes=900-", 1000)).toEqual({ status: 206, start: 900, end: 999 })
  })

  it("clamps an end beyond the file size to the last byte", () => {
    expect(parseRange("bytes=900-5000", 1000)).toEqual({ status: 206, start: 900, end: 999 })
  })

  it("treats a malformed range header as a full-range 206 (matches the current inline behavior)", () => {
    expect(parseRange("garbage", 1000)).toEqual({ status: 206, start: 0, end: 999 })
  })

  it("returns 416 when start is after end", () => {
    expect(parseRange("bytes=999-100", 1000)).toEqual({ status: 416 })
  })
})
