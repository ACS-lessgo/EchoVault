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
  const isDev = !app.isPackaged

  mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets", "icons", "app-icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // webSecurity stays true (default)
      devTools: isDev,
    },
    minHeight: 600,
    minWidth: 850,
  })

  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize()
    mainWindow.show()

    // force close devTools if somehow opened
    if (!isDev && mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools()
    }
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    )
  }

  if (!isDev) {
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow.webContents.closeDevTools()
    })
  }
}

// performance improvements

app.commandLine.appendSwitch(
  "disable-features",
  "CalculateNativeWinOcclusion,MediaSessionService,HardwareMediaKeyHandling"
)
app.commandLine.appendSwitch("disable-gpu-process-crash-limit")
app.commandLine.appendSwitch("js-flags", "--max-old-space-size=512") // cap V8 heap to 512 MB

app.whenReady().then(() => {
  console.log("Registering echovault protocol...")

  protocol.registerBufferProtocol("echovault", (request, callback) => {
    try {
      let filePath = request.url.substring(11)

      const wslMatch = filePath.match(/^\/([A-Za-z])\/(.*)$/)
      if (wslMatch) {
        filePath = `${wslMatch[1].toUpperCase()}:/${wslMatch[2]}`
      }

      filePath = path.normalize(filePath)
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
  if (process.platform !== "darwin") {
    app.quit()
    app.exit(0)
  }
})

app.on("before-quit", () => {
  // Force close all windows and cleanup
  BrowserWindow.getAllWindows().forEach((win) => win.destroy())
})
