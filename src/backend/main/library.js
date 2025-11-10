import { dialog, ipcMain } from "electron"
import { scanFolder } from "./scanner.js"
import { watchFolders } from "./watcher.js"
import {
  GET_FOLDERS_WITH_TRACK_COUNT,
  DELETE_FOLDER,
  CLEAN_ORPHAN_TRACKS,
  GET_FOLDER_PATHS,
  DELETE_ARTIST_WITHOUT_TRACKS,
  INCREMENT_PLAY_COUNT,
  GET_TOP_PLAYED_TRACKS,
  GET_TOP_PLAYED_ARTISTS,
  GET_TOTAL_PLAYS,
} from "../db/queries.js"

export function registerLibraryHandlers(mainWindow, db) {
  // add folder
  ipcMain.handle("library:add-folder", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory", "multiSelections"],
    })
    if (result.canceled) return db.prepare(GET_FOLDERS_WITH_TRACK_COUNT).all()

    for (const folder of result.filePaths) await scanFolder(db, folder)
    watchFolders(db)

    return db.prepare(GET_FOLDERS_WITH_TRACK_COUNT).all()
  })

  // folders
  ipcMain.handle("library:get-folders", () =>
    db.prepare(GET_FOLDERS_WITH_TRACK_COUNT).all()
  )

  // remove folder
  ipcMain.handle("library:remove-folder", (e, folderPath) => {
    db.prepare(DELETE_FOLDER).run(folderPath)
    db.prepare(CLEAN_ORPHAN_TRACKS).run()
    // clean up empty artists
    db.prepare(DELETE_ARTIST_WITHOUT_TRACKS).run()

    watchFolders(db)
    return db.prepare(GET_FOLDERS_WITH_TRACK_COUNT).all()
  })

  // rescan
  ipcMain.handle("library:rescan-library", async () => {
    const folders = db.prepare(GET_FOLDER_PATHS).all()
    for (const { path } of folders) await scanFolder(db, path)
    watchFolders(db)
    return db.prepare(GET_FOLDERS_WITH_TRACK_COUNT).all()
  })

  // Increment play count when a track is played
  ipcMain.handle("increment-play-count", async (event, trackId) => {
    try {
      const stmt = db.prepare(INCREMENT_PLAY_COUNT)
      stmt.run(trackId)
      return { success: true }
    } catch (error) {
      console.error("Error incrementing play count:", error)
      throw error
    }
  })

  // Get top 10 most played tracks
  ipcMain.handle("get-top-played-tracks", async () => {
    try {
      const stmt = db.prepare(GET_TOP_PLAYED_TRACKS)
      const tracks = stmt.all()

      // Add cover data URLs using custom protocol
      const withCovers = await Promise.all(
        tracks.map(async (track) => {
          if (track.cover) {
            const url = track.cover.startsWith("/")
              ? `echovault://${track.cover}`
              : `echovault:///${track.cover}`
            return {
              ...track,
              coverDataUrl: url,
            }
          } else {
            return { ...track, coverDataUrl: null }
          }
        })
      )

      return withCovers
    } catch (error) {
      console.error("Error getting top played tracks:", error)
      return []
    }
  })

  // Get top 10 most played artists
  ipcMain.handle("get-top-played-artists", async () => {
    try {
      const stmt = db.prepare(GET_TOP_PLAYED_ARTISTS)
      return stmt.all()
    } catch (error) {
      console.error("Error getting top played artists:", error)
      return []
    }
  })

  // Get total plays count
  ipcMain.handle("get-total-plays", async () => {
    try {
      const stmt = db.prepare(GET_TOTAL_PLAYS)
      const result = stmt.get()
      return { totalPlays: result.totalPlays || 0 }
    } catch (error) {
      console.error("Error getting total plays:", error)
      return { totalPlays: 0 }
    }
  })

  // Get artist by name (for cover data)
  ipcMain.handle("get-artist-by-name", async (event, name) => {
    try {
      const stmt = db.prepare(GET_ARTIST_BY_NAME)
      const artist = stmt.get(name)
      return artist || null
    } catch (error) {
      console.error("Error getting artist by name:", error)
      return null
    }
  })
}
