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

---

## Known Bugs

- Tracks with the same filename in different folders overwrite cover
- FLAC duration sometimes returns `NaN`
- Watcher re-triggers too often on folder changes
- Metadata extraction fails for some cases
- Music playback fails for some songs , this causes glitch in the playerbar and queue indexes
- Music playback stops and wont reset until app restart when queue play ends

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
- Fixed: cover image for same artist spreads for all related tracks
- Fixed: built app doesnt load home page on launch or takes too much time
- Fixed: RAM leak in app player
- Fixed: added a fallback mechanism for audio decode error

---

_Last updated: 2025-11-09_
