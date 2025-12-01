import { ipcMain, BrowserWindow } from "electron"

export function registerDesktopMediaHandlers(mainWindow) {
  ipcMain.on("update-media-metadata", (event, metadata) => {
    // called from renderer to update system media info
    mainWindow.webContents.executeJavaScript(`
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata(${JSON.stringify(metadata)});
    }
  `)
  })

  ipcMain.on("update-playback-state", (event, state) => {
    mainWindow.webContents.executeJavaScript(`
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = '${state}';
    }
  `)
  })
}
