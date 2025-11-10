import { ipcMain, BrowserWindow } from "electron"
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

  ipcMain.handle(
    "player:streamChunk",
    async (event, trackPath, offset, size) => {
      try {
        const buffer = Buffer.alloc(size)
        const fd = fs.openSync(trackPath, "r")
        const bytesRead = fs.readSync(fd, buffer, 0, size, offset)
        fs.closeSync(fd)

        // Return only the bytes actually read
        return buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + bytesRead
        )
      } catch (err) {
        console.error("Failed to read chunk:", err)
        throw err
      }
    }
  )

  ipcMain.handle("player:getFileSize", (event, trackPath) => {
    try {
      return fs.statSync(trackPath).size
    } catch (err) {
      console.error("Failed to get file size:", err)
      throw err
    }
  })

  let isProgrammaticResize = false

  ipcMain.handle("enable-mini-player", () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win && !isProgrammaticResize) {
      isProgrammaticResize = true
      win.setSize(350, 650)
      win.center()
      setTimeout(() => {
        isProgrammaticResize = false
      }, 500)
    }
  })

  ipcMain.handle("restore-window-size", () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win && !isProgrammaticResize) {
      isProgrammaticResize = true
      win.setSize(1200, 900)
      win.center()
      setTimeout(() => {
        isProgrammaticResize = false
      }, 500)
    }
  })
}
