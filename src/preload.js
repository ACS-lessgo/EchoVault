import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("api", {
  // library
  addFolder: () => ipcRenderer.invoke("library:add-folder"),
  getFolders: () => ipcRenderer.invoke("library:get-folders"),
  removeFolder: (path) => ipcRenderer.invoke("library:remove-folder", path),
  rescanLibrary: () => ipcRenderer.invoke("library:rescan-library"),

  // tracks
  getTracks: () => ipcRenderer.invoke("tracks:get-tracks"),
  getEmbeddedLyrics: (filePath) =>
    ipcRenderer.invoke("tracks:get-embedded-lyrics", filePath),
  toggleLike: (trackId, isLiked) =>
    ipcRenderer.invoke("tracks:updateLike", trackId, isLiked),
  getLikedTracks: () => ipcRenderer.invoke("tracks:get-liked-tracks"),

  // artists
  getArtists: () => ipcRenderer.invoke("artists:get-artists"),
  getTracksByArtist: (artistId) =>
    ipcRenderer.invoke("artists:get-tracks-by-artist", artistId),

  // player
  playTrack: (track) => ipcRenderer.invoke("player:play", track),
  streamChunk: (trackPath, offset, size) =>
    ipcRenderer.invoke("player:streamChunk", trackPath, offset, size),
  getFileSize: (trackPath) =>
    ipcRenderer.invoke("player:getFileSize", trackPath),

  // toast
  showToast: (message, type = "info") => {
    document.dispatchEvent(
      new CustomEvent("show-toast", { detail: { message, type } })
    )
  },
})
