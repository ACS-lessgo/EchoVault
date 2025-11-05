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

  // Prepare artist-related statements
  const insertArtist = db.prepare(
    "INSERT OR IGNORE INTO artists (name) VALUES (?)"
  )
  const getArtist = db.prepare("SELECT id, cover FROM artists WHERE name=?")
  const updateArtistCover = db.prepare("UPDATE artists SET cover=? WHERE id=?")

  watcher
    .on("add", async (filePath) => {
      if (!/\.(mp3|flac|wav|m4a|ogg)$/i.test(path.extname(filePath))) return
      const folderPath = path.dirname(filePath)
      const folderId = db
        .prepare("SELECT id FROM folders WHERE path=?")
        .get(folderPath)?.id
      if (!folderId) return

      try {
        const meta = await extractMetadata(filePath)
        if (!meta) return

        const artistName = meta.artist || "Unknown Artist"

        // Insert or get artist id
        insertArtist.run(artistName)
        const artistRow = getArtist.get(artistName)
        const artistId = artistRow?.id || null

        // If artist has no cover, set from this track
        if (!artistRow.cover && meta.cover) {
          updateArtistCover.run(meta.cover, artistId)
        }

        // Insert or update track with artist_id
        db.prepare(
          `
            INSERT INTO tracks (folder_id, artist_id, file_path, title, album, artist, duration, cover)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(file_path) DO UPDATE SET
              folder_id=excluded.folder_id,
              artist_id=excluded.artist_id,
              title=excluded.title,
              album=excluded.album,
              artist=excluded.artist,
              duration=excluded.duration,
              cover=excluded.cover
          `
        ).run(
          folderId,
          artistId,
          filePath,
          meta.title || path.basename(filePath),
          meta.album || "",
          artistName,
          meta.duration || 0,
          meta.cover || null
        )
      } catch (err) {
        console.warn("Metadata extraction failed:", filePath, err.message)
      }
    })
    .on("unlink", (filePath) => {
      db.prepare("DELETE FROM tracks WHERE file_path=?").run(filePath)
    })
}
