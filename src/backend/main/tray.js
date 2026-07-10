import { app, ipcMain, Tray, Menu, nativeImage } from "electron"
import path from "node:path"
import fs from "node:fs"
import log from "electron-log/main"

let tray = null

function coverIcon(coverPath) {
  if (!coverPath || !fs.existsSync(coverPath)) return undefined
  const img = nativeImage.createFromPath(coverPath)
  return img.isEmpty() ? undefined : img.resize({ width: 16, height: 16 })
}

function buildMenu(mainWindow, nowPlaying) {
  const { title, artist, isPlaying, shuffleEnabled, cover } = nowPlaying
  const nowPlayingLabel = title ? `${title} — ${artist || "Unknown artist"}` : "Nothing playing"

  return Menu.buildFromTemplate([
    { label: nowPlayingLabel, enabled: false, icon: coverIcon(cover) },
    { type: "separator" },
    {
      label: isPlaying ? "Pause" : "Play",
      enabled: Boolean(title),
      click: () => mainWindow.webContents.send("tray:control", "toggle-play"),
    },
    {
      label: "Next",
      click: () => mainWindow.webContents.send("tray:control", "next"),
    },
    {
      label: "Previous",
      click: () => mainWindow.webContents.send("tray:control", "previous"),
    },
    { type: "separator" },
    {
      label: `Shuffle: ${shuffleEnabled ? "On" : "Off"}`,
      click: () => mainWindow.webContents.send("tray:control", "toggle-shuffle"),
    },
    {
      label: "Volume Up",
      click: () => mainWindow.webContents.send("tray:control", "volume-up"),
    },
    {
      label: "Volume Down",
      click: () => mainWindow.webContents.send("tray:control", "volume-down"),
    },
    { type: "separator" },
    { label: "Show EchoVault", click: () => mainWindow.show() },
    { label: "Quit", click: () => app.quit() },
  ])
}

export function registerTrayHandlers(mainWindow) {
  const iconPath = path.join(__dirname, "assets", "icons", "app-icon.png")
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })

  tray = new Tray(icon)
  tray.setToolTip("EchoVault")

  let nowPlaying = { title: "", artist: "", isPlaying: false, shuffleEnabled: false, cover: "" }
  tray.setContextMenu(buildMenu(mainWindow, nowPlaying))

  ipcMain.on("tray:update", (event, info) => {
    nowPlaying = info || nowPlaying
    tray.setToolTip(
      nowPlaying.title ? `${nowPlaying.title} — ${nowPlaying.artist || "Unknown artist"}` : "EchoVault"
    )
    tray.setContextMenu(buildMenu(mainWindow, nowPlaying))
  })

  log.info("tray :: Tray created")
}

export function destroyTray() {
  if (tray) {
    tray.destroy()
    tray = null
    log.info("tray :: Tray destroyed")
  }
}
