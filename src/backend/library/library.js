import { dialog, ipcMain } from "electron"
import { scanFolder } from "./scanner.js"
import { watchFolders } from "./watcher.js"
import {
  GET_FOLDERS_WITH_TRACK_COUNT,
  DELETE_FOLDER,
  CLEAN_ORPHAN_TRACKS,
  GET_FOLDER_PATHS,
} from "../db/queries.js"

export function registerLibraryHandlers(mainWindow, db) {
  // add folder
  ipcMain.handle("library:add-folder", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory", "multiSelections"],
    })
    if (result.canceled) return []

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
}
