import { parseLrc } from "./lrcParser.js";
import log from "../../logger.js";
const LRCLIB_ENDPOINT = "https://lrclib.net/api/get";
const TIMEOUT_MS = 20000;
// ponytail: hardcoded rather than read from package.json at runtime —
// import.meta.url isn't a real file:// URL once Vite bundles the main
// process, so a dynamic read crashes the packaged app on startup.
// const USER_AGENT = "EchoVault/1.0.1-beta (+https://github.com/ACS-lessgo/EchoVault)"
async function requestLrclib(params) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const url = `${LRCLIB_ENDPOINT}?${params}`;
  const startedAt = Date.now();
  log.info("lrclib :: request ::", url);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      // headers: { "User-Agent": USER_AGENT },
    });
    const elapsedMs = Date.now() - startedAt;
    if (!response.ok) {
      log.info(
        `lrclib :: response :: http-${response.status} (${elapsedMs}ms) ::`,
        url,
      );
      return { lyrics: null, reason: `http-${response.status}` };
    }
    const data = await response.json();
    log.info(
      `lrclib :: response :: 200 (${elapsedMs}ms) id=${data?.id} duration=${data?.duration} instrumental=${!!data?.instrumental} plainLyrics=${!!data?.plainLyrics} syncedLyrics=${!!data?.syncedLyrics} ::`,
      url,
    );
    if (!data?.syncedLyrics) {
      return { lyrics: null, reason: "no-synced-lyrics" };
    }
    return { lyrics: parseLrc(data.syncedLyrics), reason: "ok" };
  } catch (err) {
    const elapsedMs = Date.now() - startedAt;
    if (err.name === "AbortError") {
      log.info(
        `lrclib :: response :: aborted after ${elapsedMs}ms (timeout=${TIMEOUT_MS}ms) ::`,
        url,
      );
      return { lyrics: null, reason: "timeout" };
    }
    log.info(
      `lrclib :: response :: network-error after ${elapsedMs}ms :: ${err.message} ::`,
      url,
    );
    return { lyrics: null, reason: `network-error: ${err.message}` };
  } finally {
    clearTimeout(timeout);
  }
}
export async function fetchLyricsFromLrclib({
  artist,
  title,
  album,
  duration,
}) {
  log.info(
    `lrclib :: lookup :: artist="${artist}" title="${title}" album="${album}" duration=${duration}`,
  );
  if (!artist || !title)
    return { lyrics: null, reason: "missing-artist-or-title" };
  const baseParams = new URLSearchParams({
    artist_name: artist,
    track_name: title,
  });
  if (duration) baseParams.set("duration", String(Math.round(duration)));
  if (album) {
    const withAlbum = new URLSearchParams(baseParams);
    withAlbum.set("album_name", album);
    const withAlbumResult = await requestLrclib(withAlbum);
    if (withAlbumResult.lyrics) return withAlbumResult;
  }
  return requestLrclib(baseParams);
}
