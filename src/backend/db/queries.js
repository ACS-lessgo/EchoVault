//  Folders
export const GET_FOLDERS_WITH_TRACK_COUNT = `
  SELECT f.*, COUNT(t.id) AS trackCount
  FROM folders f
  LEFT JOIN tracks t ON f.id = t.folder_id
  GROUP BY f.id
`
export const DELETE_FOLDER = `DELETE FROM folders WHERE path=?`
export const CLEAN_ORPHAN_TRACKS = `
  DELETE FROM tracks WHERE folder_id NOT IN (SELECT id FROM folders)
`
export const GET_FOLDER_PATHS = `SELECT path FROM folders`
export const INSERT_FOLDER_IF_NOT_EXISTS = `
  INSERT OR IGNORE INTO folders (path) VALUES (?)
`
export const GET_FOLDER_ID_BY_PATH = `
  SELECT id FROM folders WHERE path=?
`

//  Tracks
export const GET_TRACKS = `SELECT * FROM tracks`
export const GET_LIKED_TRACKS = `SELECT * FROM tracks WHERE isLiked=1`
export const UPDATE_LIKE = `UPDATE tracks SET isLiked = ? WHERE id = ?`
export const DELETE_TRACK_BY_PATH = `DELETE FROM tracks WHERE file_path=?`
export const GET_TRACK_PATHS_BY_FOLDER = `
  SELECT file_path FROM tracks WHERE folder_id=?
`
export const CHECK_TRACK_EXISTS = `
  SELECT 1 FROM tracks WHERE file_path=?
`
export const UPSERT_TRACK = `
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
`

//  Artists
export const GET_ARTISTS = `SELECT * FROM artists ORDER BY name`
export const GET_TRACKS_BY_ARTIST = `
  SELECT * FROM tracks
  WHERE artist_id = ?
  ORDER BY album, title
`
export const INSERT_ARTIST_IF_NOT_EXISTS = `
  INSERT OR IGNORE INTO artists (name) VALUES (?)
`
export const GET_ARTIST_BY_NAME = `
  SELECT id, cover FROM artists WHERE name=?
`
export const UPDATE_ARTIST_COVER = `
  UPDATE artists SET cover=? WHERE id=?
`
export const DELETE_ARTIST_WITHOUT_TRACKS = `
  DELETE FROM artists
  WHERE id NOT IN (SELECT DISTINCT artist_id FROM tracks WHERE artist_id IS NOT NULL)
`
