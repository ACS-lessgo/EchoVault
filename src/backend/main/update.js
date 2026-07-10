import { app, ipcMain, shell } from "electron"
import { checkForUpdates } from "./updateCheck.js"
import log from "../../logger.js"

const CHECK_DELAY_MS = 5000
// Only ever open GitHub release links — renderer-supplied URLs are otherwise untrusted.
const ALLOWED_HOSTS = new Set(["github.com"])

export function registerUpdateHandlers(mainWindow) {
  ipcMain.handle("update:check", () => checkForUpdates())
  ipcMain.handle("app:get-version", () => app.getVersion())

  ipcMain.handle("update:open-external", (_event, url) => {
    try {
      const parsed = new URL(url)
      if (!ALLOWED_HOSTS.has(parsed.hostname)) {
        log.warn(`update :: refused to open non-GitHub URL: ${url}`)
        return { success: false, reason: "host-not-allowed" }
      }
      shell.openExternal(url)
      return { success: true }
    } catch {
      log.warn(`update :: invalid URL: ${url}`)
      return { success: false, reason: "invalid-url" }
    }
  })

  setTimeout(async () => {
    const result = await checkForUpdates()
    if (result.available && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update:available", result)
    }
  }, CHECK_DELAY_MS)
}
