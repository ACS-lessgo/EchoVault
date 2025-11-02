import chokidar from "chokidar"
import path from "node:path"
import { extractMetadata } from "./scanner.js"

let watcher = null

export function watchFolders(db) {
  if (watcher) watcher.close()
  const folders = db
    .prepare("SELECT path FROM folders")
    .all()
    .map((f) => f.path)
  console.log("watchFolders watching these folders:", folders)
  watcher = chokidar.watch(folders, { ignoreInitial: false })

  watcher
    .on("add", async (filePath) => {
      if (!/\.(mp3|flac|wav|m4a|ogg)$/i.test(path.extname(filePath))) return
      const folderPath = path.dirname(filePath)
      const folderId = db
        .prepare("SELECT id FROM folders WHERE path=?")
        .get(folderPath)?.id
      if (!folderId) return

      // console.log("Calling extractMetadata for:", filePath)
      const meta = await extractMetadata(filePath)
      // console.log("Extracted metadata:", meta)
      if (meta) {
        db.prepare(
          `INSERT OR REPLACE INTO tracks 
           (folder_id, file_path, title, artist, album, duration, cover)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          folderId,
          filePath,
          meta.title,
          meta.artist,
          meta.album,
          meta.duration,
          meta.cover
        )
      }
    })
    .on("unlink", (filePath) => {
      db.prepare("DELETE FROM tracks WHERE file_path=?").run(filePath)
    })
}
