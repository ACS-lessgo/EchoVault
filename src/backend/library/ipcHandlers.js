import { dialog, ipcMain } from "electron"
import { scanFolder } from "./scanner.js"
import { watchFolders } from "./watcher.js"
import { extractEmbeddedLyrics } from "../utils/embeddedLyrics.js"
import { parseFile } from "music-metadata"
import fs from "fs"

export function registerLibraryHandlers(mainWindow, db) {
  ipcMain.handle("library:add-folder", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory", "multiSelections"],
    })
    if (result.canceled) return []
    for (const folder of result.filePaths) await scanFolder(db, folder)
    console.log("Calling watchFolders")
    watchFolders(db)
    return db
      .prepare(
        `
      SELECT f.*, COUNT(t.id) AS trackCount
      FROM folders f
      LEFT JOIN tracks t ON f.id = t.folder_id
      GROUP BY f.id
    `
      )
      .all()
  })

  ipcMain.handle("library:get-folders", () =>
    db
      .prepare(
        `
      SELECT f.*, COUNT(t.id) AS trackCount
      FROM folders f
      LEFT JOIN tracks t ON f.id = t.folder_id
      GROUP BY f.id
    `
      )
      .all()
  )

  ipcMain.handle("library:remove-folder", (e, folderPath) => {
    console.log("Removing folder:", folderPath)
    db.prepare("DELETE FROM folders WHERE path=?").run(folderPath)
    db.prepare(
      "DELETE FROM tracks WHERE folder_id NOT IN (SELECT id FROM folders)"
    ).run()
    watchFolders(db)
    return db
      .prepare(
        `
      SELECT f.*, COUNT(t.id) AS trackCount
      FROM folders f
      LEFT JOIN tracks t ON f.id = t.folder_id
      GROUP BY f.id
    `
      )
      .all()
  })

  ipcMain.handle("library:rescan-library", async () => {
    const folders = db.prepare("SELECT path FROM folders").all()
    for (const { path } of folders) await scanFolder(db, path)

    watchFolders(db)

    // Return updated folder list with fresh track counts
    return db
      .prepare(
        `
      SELECT f.*, COUNT(t.id) AS trackCount
      FROM folders f
      LEFT JOIN tracks t ON f.id = t.folder_id
      GROUP BY f.id
    `
      )
      .all()
  })

  ipcMain.handle("tracks:get-tracks", () =>
    db.prepare("SELECT * FROM tracks").all()
  )

  ipcMain.handle("tracks:get-cover-dataurl", async (event, filePath) => {
    try {
      const data = fs.readFileSync(filePath)
      return "data:image/jpeg;base64," + data.toString("base64")
    } catch (err) {
      console.error("Error reading cover file:", err)
      return null
    }
  })

  ipcMain.handle("tracks:get-liked-tracks", () =>
    db.prepare("SELECT * FROM tracks WHERE is_liked=1").all()
  )

  ipcMain.handle("tracks:updateLike", (event, trackId, isLiked) => {
    const result = db
      .prepare("UPDATE tracks SET isLiked = ? WHERE id = ?")
      .run(isLiked ? 1 : 0, trackId)
    return result.changes > 0
  })

  ipcMain.handle("tracks:get-embedded-lyrics", async (event, filePath) => {
    try {
      const metadata = await parseFile(filePath)
      const lyricsData = extractEmbeddedLyrics(metadata)

      const lyrics = lyricsData?.text || "No lyrics found."
      return lyrics
    } catch (err) {
      console.error("Failed to read lyrics:", err)
      return null
    }
  })

  ipcMain.handle("artists:get-artists", () => {
    const stmt = db.prepare(`SELECT * FROM artists ORDER BY name`)
    const artists = stmt.all()
    return artists
  })

  ipcMain.handle("artists:get-tracks-by-artist", (event, artistId) => {
    const stmt = db.prepare(
      `SELECT * FROM tracks WHERE artist_id = ? ORDER BY album, title`
    )
    const tracks = stmt.all(artistId)
    return tracks
  })
}
