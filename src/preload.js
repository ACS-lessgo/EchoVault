import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("api", {
  addFolder: () => ipcRenderer.invoke("library:add-folder"),
  getFolders: () => ipcRenderer.invoke("library:get-folders"),
  removeFolder: (path) => ipcRenderer.invoke("library:remove-folder", path),
  rescanLibrary: () => ipcRenderer.invoke("library:rescan-library"),
  getTracks: () => ipcRenderer.invoke("tracks:get-tracks"),
  getCoverDataUrl: (filePath) =>
    ipcRenderer.invoke("tracks:get-cover-dataurl", filePath),
  getEmbeddedLyrics: (filePath) =>
    ipcRenderer.invoke("tracks:get-embedded-lyrics", filePath),
  getArtists: () => ipcRenderer.invoke("artists:get-artists"),
  getTracksByArtist: (artistId) =>
    ipcRenderer.invoke("artists:get-tracks-by-artist", artistId),
  toggleLike: (trackId, isLiked) =>
    ipcRenderer.invoke("tracks:updateLike", trackId, isLiked),
})
