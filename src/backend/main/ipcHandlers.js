import { registerArtistHandlers } from "./artists"
import { registerTrackHandlers } from "./tracks"
import { registerLibraryHandlers } from "./library"

export function registerAllHandlers(mainWindow, db) {
  registerArtistHandlers(db)
  registerTrackHandlers(mainWindow, db)
  registerLibraryHandlers(mainWindow, db)
}
