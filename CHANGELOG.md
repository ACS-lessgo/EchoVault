# EchoVault

## Commits

- CORE : Backend changes
- UI : Frontend changes
- BUG : Any CORE/UI bug fix
- IMP : Enhancement of current feature
- FEAT : New feature
- DOCS : Documentation updates (README, comments)
- CHORE : Build config, dependencies, tooling
- REFACTOR : Code restructuring

---

## Pending Tasks

- Add full-screen lyrics view (linked to player)
- Web audio engine integration

---

## Known Bugs

- Tracks with the same filename in different folders overwrite cover
- FLAC duration sometimes returns `NaN`
- Watcher re-triggers too often on folder changes
- Built app doesnt load home page on launch or takes too much time
- Cover image for same artist spreads for all related tracks
- Metadata extraction fails for some cases

---

## Future Enhancements

- User feedback (recently added, most played .. summary)
- Lyrics sync support (timestamped `.lrc` parsing)
- Theming system (custom gradients, user-defined accent)

---

## Recent Fixes

- Fixed: better-sqlite3 build issue with Electron Forge (`ignore` regex trick) (dfad6e6)
- Fixed: duplicate artist rows when rescanning folders (1590622)
- Fixed: deleting folders wont cascade delete artists (536d2d3)

---

_Last updated: 2025-11-06_
