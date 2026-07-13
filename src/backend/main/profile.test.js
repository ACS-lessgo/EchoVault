import { describe, it, expect, vi, beforeEach } from "vitest"
import { dialog } from "electron"
import fs from "fs"
import { createTestDb } from "../db/testDb.js"
import { getProfile, setUsername, pickAvatar, clearAvatar } from "./profile.js"

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    default: {
      ...actual.default,
      mkdirSync: vi.fn(),
      copyFileSync: vi.fn(),
      unlinkSync: vi.fn(),
    },
  }
})

let db

beforeEach(() => {
  db = createTestDb()
  vi.clearAllMocks()
})

describe("getProfile", () => {
  it("returns empty defaults when no profile row exists", () => {
    expect(getProfile(db)).toEqual({ username: "", avatarUrl: null })
  })

  it("returns the stored username and an echovault:// avatar URL", () => {
    db.prepare("INSERT INTO profile (id, username, avatar_path) VALUES (1, ?, ?)").run(
      "Ankush",
      "/data/avatar/avatar.png"
    )

    expect(getProfile(db)).toEqual({
      username: "Ankush",
      avatarUrl: "echovault:///data/avatar/avatar.png",
    })
  })
})

describe("setUsername", () => {
  it("trims and stores the username, upserting on repeated calls", () => {
    setUsername(db, "  Ankush  ")
    expect(getProfile(db).username).toBe("Ankush")

    setUsername(db, "New Name")
    expect(getProfile(db).username).toBe("New Name")
  })
})

describe("pickAvatar", () => {
  it("copies the selected image into the avatar dir and stores its path", async () => {
    dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: ["/downloads/photo.PNG"] })

    const result = await pickAvatar({}, db)

    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining("avatar"), { recursive: true })
    expect(fs.copyFileSync).toHaveBeenCalledWith(
      "/downloads/photo.PNG",
      expect.stringMatching(/avatar\.png$/)
    )
    expect(result.avatarUrl).toMatch(/^echovault:\/\/.*avatar\.png$/)
    expect(getProfile(db).avatarUrl).toBe(result.avatarUrl)
  })

  it("returns cancelled:true without touching the filesystem when the dialog is canceled", async () => {
    dialog.showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })

    const result = await pickAvatar({}, db)

    expect(result).toEqual({ avatarUrl: null, cancelled: true })
    expect(fs.copyFileSync).not.toHaveBeenCalled()
  })
})

describe("clearAvatar", () => {
  it("deletes the avatar file and clears the stored path", () => {
    db.prepare("INSERT INTO profile (id, username, avatar_path) VALUES (1, ?, ?)").run(
      "Ankush",
      "/avatar/avatar.png"
    )

    clearAvatar(db)

    expect(fs.unlinkSync).toHaveBeenCalledWith("/avatar/avatar.png")
    expect(getProfile(db).avatarUrl).toBeNull()
  })

  it("ignores an already-missing avatar file (ENOENT)", () => {
    db.prepare("INSERT INTO profile (id, username, avatar_path) VALUES (1, ?, ?)").run(
      "Ankush",
      "/avatar/gone.png"
    )
    const enoent = Object.assign(new Error("not found"), { code: "ENOENT" })
    fs.unlinkSync.mockImplementation(() => {
      throw enoent
    })

    expect(() => clearAvatar(db)).not.toThrow()
    expect(getProfile(db).avatarUrl).toBeNull()
  })

  it("does nothing when there is no profile row", () => {
    expect(() => clearAvatar(db)).not.toThrow()
    expect(fs.unlinkSync).not.toHaveBeenCalled()
  })
})
