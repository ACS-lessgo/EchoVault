import { ipcMain } from "electron"
import fs from "fs"

export function registerPlayerHandlers(mainWindow, db) {
  ipcMain.handle("player:play", (event, trackPath) => {
    try {
      const data = fs.readFileSync(trackPath)
      // return buffer
      return data.buffer.slice(
        data.byteOffset,
        data.byteOffset + data.byteLength
      )
    } catch (err) {
      console.error("Failed to read audio file:", err)
      throw err
    }
  })
}
