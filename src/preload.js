import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("api", {
  addFolder: () => ipcRenderer.invoke("add-folder"),
  getFolders: () => ipcRenderer.invoke("get-folders"),
  removeFolder: (path) => ipcRenderer.invoke("remove-folder", path),
  rescanLibrary: () => ipcRenderer.invoke("rescan-library"),
  getTracks: () => ipcRenderer.invoke("get-tracks"),
})
