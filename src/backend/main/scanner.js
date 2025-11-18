import fs from "node:fs"
import path from "node:path"
import { app } from "electron"
import { parseFile } from "music-metadata"
import {
  INSERT_FOLDER_IF_NOT_EXISTS,
  GET_FOLDER_ID_BY_PATH,
  GET_TRACK_PATHS_BY_FOLDER,
  DELETE_TRACK_BY_PATH,
  INSERT_ARTIST_IF_NOT_EXISTS,
  GET_ARTIST_BY_NAME,
  UPDATE_ARTIST_COVER,
  CHECK_TRACK_EXISTS,
  UPSERT_TRACK,
} from "../db/queries.js"
import log from "../../logger.js"

/**
 * Extracts metadata and writes cover image if embedded.
 */
export async function extractMetadata(filePath) {
  try {
    log.info("extractMetadata :: Start")
    const metadata = await parseFile(filePath)
    log.info("extractMetadata :: metadata parsed")
    const { common, format } = metadata

    let coverPath = null
    if (common.picture && common.picture[0]) {
      const img = common.picture[0]
      const coverDir = path.join(app.getPath("userData"), "covers")
      if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir)
      coverPath = path.join(coverDir, path.basename(filePath) + ".jpg")
      fs.writeFileSync(coverPath, img.data)
    }
    log.info("extractMetadata :: coverPath :: End", coverPath)

    return {
      title: common.title || path.basename(filePath),
      artist: common.artist || "Unknown",
      album: common.album || "Unknown",
      duration: format.duration || 0,
      cover: coverPath,
    }
  } catch (err) {
    log.debug("Metadata error:", err.message)
    return null
  }
}

/**
 * Scans a folder, extracts track metadata, and updates the DB.
 * TODO: Make this recursive to scan subfolders
 */
export async function scanFolder(db, folderPath) {
  log.info("scanFolder :: Scanning folder :: Start :: ", folderPath)

  // Insert or get folder
  db.prepare(INSERT_FOLDER_IF_NOT_EXISTS).run(folderPath)
  const folderId = db.prepare(GET_FOLDER_ID_BY_PATH).get(folderPath).id

  // Collect audio files
  const filesOnDisk = fs
    .readdirSync(folderPath)
    .filter((f) => /\.(mp3|flac|m4a|wav|ogg|aac)$/i.test(f))
    .map((f) => path.join(folderPath, f))

  log.info("scanFolder :: fetched all music files")

  // Remove missing tracks
  const existingTracks = db
    .prepare(GET_TRACK_PATHS_BY_FOLDER)
    .all(folderId)
    .map((t) => t.file_path)

  const missing = existingTracks.filter((f) => !filesOnDisk.includes(f))
  if (missing.length) {
    const del = db.prepare(DELETE_TRACK_BY_PATH)
    for (const file of missing) del.run(file)
  }
  log.info("scanFolder :: remove deleted music files from db :: ", missing)

  // Prepare statements
  const insertArtist = db.prepare(INSERT_ARTIST_IF_NOT_EXISTS)
  const getArtist = db.prepare(GET_ARTIST_BY_NAME)
  const updateArtistCover = db.prepare(UPDATE_ARTIST_COVER)
  const checkTrackExists = db.prepare(CHECK_TRACK_EXISTS)
  const upsertTrack = db.prepare(UPSERT_TRACK)

  // Scan files
  log.info("scanFolder :: get meta data for each music file :: START")
  for (const filePath of filesOnDisk) {
    const exists = checkTrackExists.get(filePath)
    if (exists) continue

    try {
      const metadata = await parseFile(filePath)
      const { title, artist, album, picture } = metadata.common
      const duration = metadata.format.duration || 0
      const artistName = artist || "Unknown Artist"

      // Insert or get artist
      insertArtist.run(artistName)
      const artistRow = getArtist.get(artistName)
      const artistId = artistRow?.id || null

      // Handle cover
      let coverData = null
      if (picture && picture.length > 0) {
        const img = picture[0]
        const coverDir = path.join(app.getPath("userData"), "covers")
        if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir)
        const coverPath = path.join(coverDir, `${path.basename(filePath)}.jpg`)
        fs.writeFileSync(coverPath, img.data)
        coverData = coverPath
      }

      // Update artist cover if not already set
      if (!artistRow.cover && coverData) {
        updateArtistCover.run(coverData, artistId)
      }

      // Insert or update track
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
  log.info("scanFolder :: get meta data for each music file :: End")
  log.info(`Folder scanned: ${folderPath}`)
}
