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
  let isInMiniMode = false

  ipcMain.handle("enable-mini-player", () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win && !isProgrammaticResize && !isInMiniMode) {
      isProgrammaticResize = true
      isInMiniMode = true

      // Disable resizing first
      win.setResizable(false)

      // Set fixed mini player size
      const miniWidth = 350
      const miniHeight = 650

      win.setMinimumSize(miniWidth, miniHeight)
      win.setMaximumSize(miniWidth, miniHeight)
      win.setSize(miniWidth, miniHeight)
      win.center()

      setTimeout(() => {
        isProgrammaticResize = false
      }, 600)
    }
  })

  ipcMain.handle("restore-window-size", () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win && !isProgrammaticResize && isInMiniMode) {
      isProgrammaticResize = true
      isInMiniMode = false

      // Re-enable resizing first
      win.setResizable(true)

      // Remove size constraints
      const normalWidth = 1200
      const normalHeight = 900
      const minWidth = 800
      const minHeight = 600

      win.setMinimumSize(minWidth, minHeight)
      win.setMaximumSize(0, 0) // remove maximum size limit

      // Restore normal window size
      win.setSize(normalWidth, normalHeight)
      win.center()

      setTimeout(() => {
        isProgrammaticResize = false
      }, 600)
    }
  })

  // manual window resize
  ipcMain.handle("check-mini-mode", () => {
    return isInMiniMode
  })
}
