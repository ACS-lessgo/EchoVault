import { registerArtistHandlers } from "./artists"
import { registerTrackHandlers } from "./tracks"
import { registerLibraryHandlers } from "./library"
import { registerPlayerHandlers } from "./player"
import { registerSearchHandlers } from "./search"

export function registerAllHandlers(mainWindow, db) {
  registerArtistHandlers(db)
  registerTrackHandlers(mainWindow, db)
  registerLibraryHandlers(mainWindow, db)
  registerPlayerHandlers(mainWindow, db)
  registerSearchHandlers(mainWindow, db)
}
