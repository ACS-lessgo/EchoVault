import fs from "node:fs"
import path from "node:path"
import { app } from "electron"
import { parseFile } from "music-metadata"

export async function extractMetadata(filePath) {
  try {
    // console.log("Extracting metadata for:", filePath)
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

    // console.log("coverPath:", coverPath)

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
  console.log("Scanning folder:", folderPath)

  // Insert or get folder
  db.prepare("INSERT OR IGNORE INTO folders (path) VALUES (?)").run(folderPath)
  const folderId = db
    .prepare("SELECT id FROM folders WHERE path=?")
    .get(folderPath).id

  // Collect audio files
  const filesOnDisk = fs
    .readdirSync(folderPath)
    .filter((f) => /\.(mp3|flac|m4a|wav|ogg|aac)$/i.test(f))
    .map((f) => path.join(folderPath, f))

  // Remove missing tracks
  const existingTracks = db
    .prepare("SELECT file_path FROM tracks WHERE folder_id=?")
    .all(folderId)
    .map((t) => t.file_path)

  const missing = existingTracks.filter((f) => !filesOnDisk.includes(f))
  if (missing.length) {
    const del = db.prepare("DELETE FROM tracks WHERE file_path=?")
    for (const file of missing) del.run(file)
  }

  // Prepare statements
  const insertArtist = db.prepare(
    "INSERT OR IGNORE INTO artists (name) VALUES (?)"
  )
  const getArtist = db.prepare("SELECT id, cover FROM artists WHERE name=?")
  const updateArtistCover = db.prepare("UPDATE artists SET cover=? WHERE id=?")
  const insertTrack = db.prepare(`
    INSERT OR IGNORE INTO tracks 
    (folder_id, artist_id, file_path, title, album, artist, duration, cover)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const upsertTrack = db.prepare(`
    INSERT INTO tracks (
      folder_id, artist_id, file_path, title, album, artist, duration, cover
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(file_path) DO UPDATE SET
      folder_id=excluded.folder_id,
      artist_id=excluded.artist_id,
      title=excluded.title,
      album=excluded.album,
      artist=excluded.artist,
      duration=excluded.duration,
      cover=excluded.cover
  `)

  // Scan files
  for (const filePath of filesOnDisk) {
    const exists = db
      .prepare("SELECT 1 FROM tracks WHERE file_path=?")
      .get(filePath)
    if (exists) continue

    try {
      const metadata = await parseFile(filePath)
      const { title, artist, album, picture } = metadata.common
      const duration = metadata.format.duration || 0

      const artistName = artist || "Unknown Artist"

      // Upsert artist and get id
      const insertInfo = insertArtist.run(artistName)
      let artistId = insertInfo.lastInsertRowid
      console.log("artistId:", artistId)

      // If already existed, fetch the id
      if (!artistId) {
        const artistRow = getArtist.get(artistName)
        artistId = artistRow?.id || null
      }

      // Get cover (base64)
      let coverData = null
      if (picture && picture.length > 0) {
        const img = picture[0]
        const coverDir = path.join(app.getPath("userData"), "covers")
        if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir)
        const coverPath = path.join(
          coverDir,
          `${artistName.replace(/[\\/:*?"<>|]/g, "_")}.jpg`
        )
        fs.writeFileSync(coverPath, img.data)
        coverData = coverPath
      }

      // If artist has no cover yet, set one from this track
      const artistRow = getArtist.get(artistName)
      if (!artistRow.cover && coverData) {
        updateArtistCover.run(coverData, artistId)
      }

      // Insert track
      upsertTrack.run(
        folderId,
        artistId,
        filePath,
        title || path.basename(filePath),
        album || "",
        artistName,
        duration,
        coverData
      )
    } catch (err) {
      console.warn("Metadata read failed for:", filePath, err.message)
    }
  }

  console.log(`Folder scanned: ${folderPath}`)
}
