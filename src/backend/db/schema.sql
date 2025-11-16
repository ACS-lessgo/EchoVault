-- ============================
-- MAIN TABLES
-- ============================

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
  artist TEXT,
  duration REAL,
  cover TEXT,
  isLiked INTEGER DEFAULT 0,
  noOfPlays INTEGER DEFAULT 0,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
  FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS artists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  cover TEXT    
);