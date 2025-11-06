# EchoVault

## Pending Tasks

- Add full-screen lyrics view (linked to player)
- Web audio engine integration

---

## Known Bugs

- Tracks with the same filename in different folders overwrite cover
- FLAC duration sometimes returns `NaN`
- Watcher re-triggers too often on folder changes
- Built app doesnt load home page on launch or takes too much time
- Deleting folders wont cascade delete artists

---

## Future Enhancements

- User feedback (recently added, most played .. summary)
- Lyrics sync support (timestamped `.lrc` parsing)
- Theming system (custom gradients, user-defined accent)

---

## Recent Fixes

- Fixed: better-sqlite3 build issue with Electron Forge (`ignore` regex trick)
- Fixed: duplicate artist rows when rescanning folders

---

_Last updated: 2025-11-06_
