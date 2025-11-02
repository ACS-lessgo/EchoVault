import fs from "node:fs"
import path from "node:path"
import { app } from "electron"
import { parseFile } from "music-metadata"

export async function extractMetadata(filePath) {
  try {
    console.log("Extracting metadata for:", filePath)
    const metadata = await parseFile(filePath)
    const { common, format } = metadata

    // console.log("Metadata:", metadata)

    let coverPath = null
    if (common.picture && common.picture[0]) {
      const img = common.picture[0]
      const coverDir = path.join(app.getPath("userData"), "covers")
      if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir)
      coverPath = path.join(coverDir, path.basename(filePath) + ".jpg")
      fs.writeFileSync(coverPath, img.data)
    }

    console.log("coverPath:", coverPath)

    return {
      title: common.title || path.basename(filePath),
      artist: common.artist || "Unknown",
      album: common.album || "Unknown",
      duration: format.duration || 0,
      cover: coverPath,
    }
  } catch (err) {
    console.warn("Metadata error:", err.message)
    return null
  }
}

export async function scanFolder(db, folderPath) {
  const folder = db
    .prepare("INSERT OR IGNORE INTO folders (path) VALUES (?)")
    .run(folderPath)

  const folderId = db
    .prepare("SELECT id FROM folders WHERE path=?")
    .get(folderPath).id

  // Get list of audio files on disk
  const filesOnDisk = fs
    .readdirSync(folderPath)
    .filter((f) => /\.(mp3|flac|m4a|wav|ogg|aac)$/i.test(f))
    .map((f) => path.join(folderPath, f))

  // Remove any tracks from DB that are no longer on disk
  const existingTracks = db
    .prepare("SELECT file_path FROM tracks WHERE folder_id=?")
    .all(folderId)
    .map((t) => t.file_path)

  const missing = existingTracks.filter((f) => !filesOnDisk.includes(f))
  if (missing.length) {
    const del = db.prepare("DELETE FROM tracks WHERE file_path=?")
    for (const file of missing) del.run(file)
  }

  // Now scan new files and insert/update them
  for (const filePath of filesOnDisk) {
    const exists = db
      .prepare("SELECT 1 FROM tracks WHERE file_path=?")
      .get(filePath)
    if (exists) continue // already in DB

    try {
      const metadata = await parseFile(filePath)
      const { title, artist, album } = metadata.common
      const duration = metadata.format.duration || 0

      db.prepare(
        `INSERT INTO tracks (folder_id, file_path, title, artist, album, duration)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        folderId,
        filePath,
        title || path.basename(filePath),
        artist || "",
        album || "",
        duration
      )
    } catch (err) {
      console.warn("Metadata read failed for:", filePath, err.message)
    }
  }

  console.log(`Folder scanned: ${folderPath}`)
}
