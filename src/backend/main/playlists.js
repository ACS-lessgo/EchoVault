import { ipcMain } from "electron"

export function registerPlaylistHandlers(mainWindow, db) {
  // Get all playlists
  ipcMain.handle("get-playlists", async () => {
    try {
      const playlists = db
        .prepare(
          `
      SELECT 
        p.*,
        COUNT(pt.track_id) as track_count
      FROM playlists p
      LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `
        )
        .all()
      return playlists
    } catch (error) {
      console.error("Error getting playlists:", error)
      throw error
    }
  })

  // Create a new playlist
  ipcMain.handle("create-playlist", async (event, name) => {
    try {
      const result = db
        .prepare(
          `
      INSERT INTO playlists (name, created_at)
      VALUES (?, datetime('now'))
    `
        )
        .run(name)

      return {
        id: result.lastInsertRowid,
        name,
        cover: null,
        created_at: new Date().toISOString(),
        track_count: 0,
      }
    } catch (error) {
      console.error("Error creating playlist:", error)
      throw error
    }
  })

  // Get tracks in a playlist
  ipcMain.handle("get-playlist-tracks", async (event, playlistId) => {
    try {
      const tracks = db
        .prepare(
          `
      SELECT t.*, pt.added_at
      FROM tracks t
      INNER JOIN playlist_tracks pt ON t.id = pt.track_id
      WHERE pt.playlist_id = ?
      ORDER BY pt.added_at DESC
    `
        )
        .all(playlistId)
      return tracks
    } catch (error) {
      console.error("Error getting playlist tracks:", error)
      throw error
    }
  })

  // Add track to playlist
  ipcMain.handle(
    "add-track-to-playlist",
    async (event, playlistId, trackId) => {
      try {
        db.prepare(
          `
      INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, added_at)
      VALUES (?, ?, datetime('now'))
    `
        ).run(playlistId, trackId)

        // Update playlist cover if it doesn't have one
        const playlist = db
          .prepare("SELECT cover FROM playlists WHERE id = ?")
          .get(playlistId)
        if (!playlist.cover) {
          const track = db
            .prepare("SELECT cover FROM tracks WHERE id = ?")
            .get(trackId)
          if (track.cover) {
            db.prepare("UPDATE playlists SET cover = ? WHERE id = ?").run(
              track.cover,
              playlistId
            )
          }
        }

        return { success: true }
      } catch (error) {
        console.error("Error adding track to playlist:", error)
        throw error
      }
    }
  )

  // Remove track from playlist
  ipcMain.handle(
    "remove-track-from-playlist",
    async (event, playlistId, trackId) => {
      try {
        db.prepare(
          `
      DELETE FROM playlist_tracks
      WHERE playlist_id = ? AND track_id = ?
    `
        ).run(playlistId, trackId)
        return { success: true }
      } catch (error) {
        console.error("Error removing track from playlist:", error)
        throw error
      }
    }
  )

  // Delete playlist
  ipcMain.handle("delete-playlist", async (event, playlistId) => {
    try {
      db.prepare("DELETE FROM playlists WHERE id = ?").run(playlistId)
      return { success: true }
    } catch (error) {
      console.error("Error deleting playlist:", error)
      throw error
    }
  })

  // Update playlist name
  ipcMain.handle("update-playlist", async (event, playlistId, name) => {
    try {
      db.prepare("UPDATE playlists SET name = ? WHERE id = ?").run(
        name,
        playlistId
      )
      return { success: true }
    } catch (error) {
      console.error("Error updating playlist:", error)
      throw error
    }
  })
}
