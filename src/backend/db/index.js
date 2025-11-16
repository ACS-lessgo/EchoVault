import { app } from "electron"
import fs from "fs"
import path from "path"
import Database from "better-sqlite3"

export function initDB() {
  const dbPath = path.join(app.getPath("userData"), "sonicbox.db")
  const db = new Database(dbPath)
  db.pragma("journal_mode = WAL") // Write-Ahead Logging
  db.pragma("foreign_keys = ON") // Enforce foreign key constraints

  console.log("Foreign keys:", db.pragma("foreign_keys", { simple: true }))

  const possibleSchemaPaths = [
    path.join(process.resourcesPath, "schema.sql"), // for packaged app
    path.join(__dirname, "schema.sql"), // for dev build
    path.join(app.getAppPath(), "schema.sql"), // fallback
  ]

  let schema = null
  for (const p of possibleSchemaPaths) {
    if (fs.existsSync(p)) {
      schema = fs.readFileSync(p, "utf-8")
      break
    }
  }

  if (!schema) {
    console.warn("Schema.sql not found — using FALLBACK.")
    schema = `
      CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE
      );

      CREATE TABLE IF NOT EXISTS artists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        cover TEXT
      );

      CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folder_id INTEGER,
        artist_id INTEGER,
        file_path TEXT UNIQUE,
        title TEXT,
        album TEXT,
        artist TEXT,
        duration REAL,
        cover TEXT,
        isLiked INTEGER DEFAULT 0,
        noOfPlays INTEGER DEFAULT 0,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
        FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL
      );
    `
  }

  db.exec(schema)

  const indexStatements = [
    `CREATE INDEX IF NOT EXISTS idx_tracks_title_lower ON tracks(LOWER(title));`,
    `CREATE INDEX IF NOT EXISTS idx_tracks_artist_lower ON tracks(LOWER(artist));`,
    `CREATE INDEX IF NOT EXISTS idx_tracks_album_lower ON tracks(LOWER(album));`,

    `CREATE INDEX IF NOT EXISTS idx_tracks_folder_id ON tracks(folder_id);`,
    `CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON tracks(artist_id);`,
    `CREATE INDEX IF NOT EXISTS idx_tracks_file_path ON tracks(file_path);`,
    `CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name);`,
    `CREATE INDEX IF NOT EXISTS idx_tracks_plays ON tracks(noOfPlays DESC);`,
  ]

  for (const stmt of indexStatements) {
    db.prepare(stmt).run()
  }

  console.log("SQLite initialized at:", dbPath)
  return db
}
