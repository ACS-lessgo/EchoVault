import { ipcMain } from "electron"
import {
  GET_TRACKS,
  SEARCH_TRACKS,
  SEARCH_TRACKS_BY_ARTIST,
  SEARCH_ARTISTS,
  SEARCH_PLAYLISTS,
} from "../db/queries.js"
import log from "../../logger.js"

export function searchTracks(db, payload) {
  log.info("Search track :: Start :: ", payload)
  let query = ""
  let artistId = null

  if (typeof payload === "string") {
    query = payload
  } else if (payload && typeof payload === "object") {
    query = payload.query || ""
    artistId = payload.artistId ?? null
  }

  const q = (query || "").trim().toLowerCase()
  log.info("Search track :: Start :: query", q)

  if (!q) {
    if (artistId) {
      return db
        .prepare(`SELECT * FROM tracks WHERE artist_id = ? ORDER BY LOWER(title)`)
        .all(artistId)
    }
    return db.prepare(GET_TRACKS).all()
  }

  const like = `%${q}%`

  if (artistId) {
    log.info("artistId searched with query", artistId + " " + q)
    return db.prepare(SEARCH_TRACKS_BY_ARTIST).all(artistId, like, like, like)
  }

  log.info("Search track :: End")
  return db.prepare(SEARCH_TRACKS).all(like, like, like)
}

export function searchArtists(db, query) {
  const q = (query || "").trim().toLowerCase()

  if (!q) {
    return db.prepare("SELECT * FROM artists ORDER BY LOWER(name)").all()
  }

  const like = `%${q}%`
  return db.prepare(SEARCH_ARTISTS).all(like)
}

export function searchGlobal(db, query) {
  const q = (query || "").trim().toLowerCase()

  if (!q) {
    return { tracks: [], artists: [], playlists: [] }
  }

  const like = `%${q}%`
  const tracks = db.prepare(SEARCH_TRACKS).all(like, like, like).slice(0, 8)
  const artists = db.prepare(SEARCH_ARTISTS).all(like).slice(0, 6)
  const playlists = db.prepare(SEARCH_PLAYLISTS).all(like).slice(0, 6)

  return { tracks, artists, playlists }
}

export function registerSearchHandlers(mainWindow, db) {
  ipcMain.handle("search:tracks", (event, payload) => searchTracks(db, payload))
  ipcMain.handle("search:artists", (event, query) => searchArtists(db, query))
  ipcMain.handle("search:global", (event, query) => searchGlobal(db, query))
}
