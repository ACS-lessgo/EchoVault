// src/main/db/queries.js

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

export const GET_TRACKS = `SELECT * FROM tracks`

export const GET_LIKED_TRACKS = `SELECT * FROM tracks WHERE isLiked=1`

export const UPDATE_LIKE = `
  UPDATE tracks
  SET isLiked = ?
  WHERE id = ?
`

export const GET_ARTISTS = `SELECT * FROM artists ORDER BY name`

export const GET_TRACKS_BY_ARTIST = `
  SELECT * FROM tracks
  WHERE artist_id = ?
  ORDER BY album, title
`

export const GET_FOLDER_PATHS = `SELECT path FROM folders`
