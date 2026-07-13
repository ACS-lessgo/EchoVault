import { describe, it, expect } from "vitest"
import { parseLrc } from "./lrcParser.js"

describe("parseLrc", () => {
  it("computes endTime as Infinity for a single timestamp line", () => {
    const result = parseLrc("[00:12.00]Hello world")
    expect(result.timestamps).toEqual([
      { startTime: 12, text: "Hello world", endTime: Infinity },
    ])
    expect(result.synchronized).toBe(true)
  })

  it("computes endTime from the next entry's startTime for multi-timestamp lines", () => {
    const result = parseLrc("[00:12.00][00:45.00]Hello world")
    expect(result.timestamps).toEqual([
      { startTime: 12, text: "Hello world", endTime: 45 },
      { startTime: 45, text: "Hello world", endTime: Infinity },
    ])
  })

  it("returns null for a metadata-only file", () => {
    const result = parseLrc("[ar:Some Artist]\n[ti:Some Title]\n[by:Someone]")
    expect(result).toBeNull()
  })

  it("strips a leading BOM before parsing", () => {
    const result = parseLrc("﻿[00:01.500]First line\n[00:03.250]Second line")
    expect(result.timestamps).toEqual([
      { startTime: 1.5, text: "First line", endTime: 3.25 },
      { startTime: 3.25, text: "Second line", endTime: Infinity },
    ])
  })
})
