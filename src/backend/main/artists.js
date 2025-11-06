import { ipcMain } from "electron"
import { GET_ARTISTS, GET_TRACKS_BY_ARTIST } from "../db/queries.js"

export function registerArtistHandlers(db) {
  ipcMain.handle("artists:get-artists", () => db.prepare(GET_ARTISTS).all())

  ipcMain.handle("artists:get-tracks-by-artist", (event, artistId) => {
    return db.prepare(GET_TRACKS_BY_ARTIST).all(artistId)
  })
}
