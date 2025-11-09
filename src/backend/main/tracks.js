import { ipcMain } from "electron"
import fs from "fs"
import { parseFile } from "music-metadata"
import { extractEmbeddedLyrics } from "../utils/embeddedLyrics.js"
import { GET_TRACKS, GET_LIKED_TRACKS, UPDATE_LIKE } from "../db/queries.js"

export function registerTrackHandlers(mainWindow, db) {
  // tracks
  ipcMain.handle("tracks:get-tracks", () => db.prepare(GET_TRACKS).all())

  // liked
  ipcMain.handle("tracks:get-liked-tracks", () =>
    db.prepare(GET_LIKED_TRACKS).all()
  )

  // like a track
  ipcMain.handle("tracks:updateLike", (event, trackId, isLiked) => {
    const result = db.prepare(UPDATE_LIKE).run(isLiked ? 1 : 0, trackId)
    return result.changes > 0
  })

  // lyrics
  ipcMain.handle("tracks:get-embedded-lyrics", async (event, filePath) => {
    try {
      const metadata = await parseFile(filePath)
      const lyricsData = extractEmbeddedLyrics(metadata)
      return lyricsData?.text || "No lyrics found."
    } catch (err) {
      console.error("Failed to read lyrics:", err)
      return null
    }
  })
}
