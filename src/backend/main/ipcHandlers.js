import { registerArtistHandlers } from "./artists"
import { registerTrackHandlers } from "./tracks"
import { registerLibraryHandlers } from "./library"
import { registerPlayerHandlers } from "./player"

export function registerAllHandlers(mainWindow, db) {
  registerArtistHandlers(db)
  registerTrackHandlers(mainWindow, db)
  registerLibraryHandlers(mainWindow, db)
  registerPlayerHandlers(mainWindow, db)
}
