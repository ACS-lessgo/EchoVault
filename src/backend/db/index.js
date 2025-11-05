import { app } from "electron"
import fs from "fs"
import path from "path"
import Database from "better-sqlite3"

export function initDB() {
  const dbPath = path.join(app.getPath("userData"), "sonicbox.db")
  const db = new Database(dbPath)
  db.pragma("journal_mode = WAL")
  db.pragma("foreign_keys = ON")

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

      CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folder_id INTEGER,
        artist_id INTEGER,
        file_path TEXT UNIQUE,
        title TEXT,
        album TEXT,
        duration REAL,
        cover TEXT,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
        FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL,
        UNIQUE(title, artist_id, album)
      );

      CREATE TABLE IF NOT EXISTS artists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        cover TEXT
      );
    `
  }

  db.exec(schema)
  console.log("SQLite DB initialized at:", dbPath)
  return db
}
