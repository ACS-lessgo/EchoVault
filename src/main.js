import { app, BrowserWindow, protocol } from "electron"
import path from "node:path"
import fs from "node:fs"
import started from "electron-squirrel-startup"
import { initDB } from "./backend/db/index.js"
import { registerAllHandlers } from "./backend/main/ipcHandlers.js"

if (started) app.quit()

let mainWindow

// MUST be before app.whenReady()
protocol.registerSchemesAsPrivileged([
  {
    scheme: "echovault",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: false,
    },
  },
])

function createWindow() {
  mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets", "icons", "app-icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // webSecurity stays true (default)
    },
  })

  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    )
  }
}

app.whenReady().then(() => {
  console.log("Registering echovault protocol...")

  protocol.registerBufferProtocol("echovault", (request, callback) => {
    try {
      let filePath = request.url.substring(11)
      if (!filePath.startsWith("/")) {
        filePath = "/" + filePath
      }
      filePath = decodeURIComponent(filePath)

      if (!fs.existsSync(filePath)) {
        return callback({ error: -6 })
      }

      const data = fs.readFileSync(filePath)
      const ext = path.extname(filePath).toLowerCase()

      const mimeTypes = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
      }

      callback({
        mimeType: mimeTypes[ext] || "image/jpeg",
        data: data,
      })
    } catch (err) {
      console.error("[echovault] Error:", err)
      callback({ error: -2 })
    }
  })

  const db = initDB()
  registerAllHandlers(mainWindow, db)
  createWindow()
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
