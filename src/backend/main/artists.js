import { ipcMain } from "electron"
import { GET_ARTISTS, GET_TRACKS_BY_ARTIST } from "../db/queries.js"

export function getArtists(db) {
  return db.prepare(GET_ARTISTS).all()
}

export function getTracksByArtist(db, artistId) {
  return db.prepare(GET_TRACKS_BY_ARTIST).all(artistId)
}

export function registerArtistHandlers(db) {
  ipcMain.handle("artists:get-artists", () => getArtists(db))
  ipcMain.handle("artists:get-tracks-by-artist", (event, artistId) => getTracksByArtist(db, artistId))
}
