# db.py
import sqlite3
from pathlib import Path

class SonicDB:
    def __init__(self, db_path: str):
        self.db_path = Path(db_path)
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row

    def get_folders(self):
        cur = self.conn.execute("SELECT * FROM folders")
        return [dict(row) for row in cur.fetchall()]

    def get_tracks(self):
        query = """
        SELECT 
            tracks.id,
            tracks.file_path,
            tracks.title,
            tracks.album,
            tracks.artist,
            tracks.duration,
            tracks.isLiked,
            tracks.noOfPlays,
            folders.path AS folder_path,
            artists.name AS artist_name
        FROM tracks
        LEFT JOIN folders ON tracks.folder_id = folders.id
        LEFT JOIN artists ON tracks.artist_id = artists.id
        ORDER BY tracks.title COLLATE NOCASE;
        """
        cur = self.conn.execute(query)
        return [dict(row) for row in cur.fetchall()]

    def get_tracks_by_folder(self, folder_id: int):
        cur = self.conn.execute(
            "SELECT * FROM tracks WHERE folder_id = ?", (folder_id,)
        )
        return [dict(row) for row in cur.fetchall()]

    def add_folder(self, path: str):
        self.conn.execute(
            "INSERT OR IGNORE INTO folders(path) VALUES(?)", (path,)
        )
        self.conn.commit()

    def delete_folder(self, folder_id: int):
        self.conn.execute("DELETE FROM folders WHERE id = ?", (folder_id,))
        self.conn.commit()

    def close(self):
        self.conn.close()
