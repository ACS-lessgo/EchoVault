import { app, BrowserWindow } from "electron"
import path from "node:path"
import started from "electron-squirrel-startup"
import { initDB } from "./backend/db/index.js"
import { registerLibraryHandlers } from "./backend/library/ipcHandlers.js"

if (started) app.quit()

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL)
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  else
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    )

  // Open chrome dev tools on startup
  // mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  const db = initDB()
  registerLibraryHandlers(mainWindow, db)
  createWindow()
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
