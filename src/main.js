import { app, BrowserWindow } from "electron"
import path from "node:path"
import started from "electron-squirrel-startup"
import { initDB } from "./backend/db/index.js"
import { registerAllHandlers } from "./backend/library/ipcHandlers.js"

if (started) app.quit()

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    // find the app icon
    icon: path.join(__dirname, "assets", "icons", "app-icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      // dont allow browser to access node
      nodeIntegration: false,
    },
  })

  console.log(
    "icon path",
    path.join(__dirname, "assets", "icons", "app-icon.png")
  )

  // make the app fullscreen on startup
  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize()
    mainWindow.show()
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
  // init database
  const db = initDB()

  // register library handlers and create window
  registerAllHandlers(mainWindow, db)
  createWindow()
})

app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits with Cmd + Q
  if (process.platform !== "darwin") app.quit()
})
