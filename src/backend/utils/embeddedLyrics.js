import log from "../../logger"

function isLyricsTag(tagId, format) {
  const lyricsTagIds = [
    "USLT",
    "LYRICS",
    "UNSYNCED LYRICS",
    "UNSYNCEDLYRICS",
    "SYLT",
    "SYNCHRONIZED LYRICS",
    "SYNCEDLYRICS",
    "TXXX",
    "©LYR",
    "LYR",
    "LYRICIST",
  ]

  // For the Vorbis Comments format, also check for other possible tags.
  if (format === "vorbis") {
    lyricsTagIds.push("LYRICS", "UNSYNCEDLYRICS", "SYNCEDLYRICS")
  }

  // For APE format
  if (format === "APEv2") {
    lyricsTagIds.push("Lyrics", "LYRICS")
  }

  return lyricsTagIds.includes(tagId)
}

function extractLyricsText(value) {
  if (!value) {
    return null
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed || null
  }

  if (typeof value === "object") {
    if (value.text && typeof value.text === "string") {
      const trimmed = value.text.trim()
      return trimmed || null
    }

    if (value.lyrics && typeof value.lyrics === "string") {
      const trimmed = value.lyrics.trim()
      return trimmed || null
    }

    const possibleKeys = ["lyric", "content", "data", "value"]
    for (const key of possibleKeys) {
      if (value[key] && typeof value[key] === "string") {
        const trimmed = value[key].trim()
        return trimmed || null
      }
    }

    if (Array.isArray(value) && value.length > 0) {
      for (const item of value) {
        if (typeof item === "string") {
          const trimmed = item.trim()
          return trimmed || null
        } else if (typeof item === "object" && item.text) {
          const trimmed = item.text.trim()
          return trimmed || null
        }
      }
    }
  }

  return null
}

function extractSynchronizedLyrics(value) {
  log.info("Extracting synchronized lyrics:", {
    type: typeof value,
    isArray: Array.isArray(value),
    keys: typeof value === "object" && value ? Object.keys(value) : null,
  })

  if (!value || typeof value !== "object") {
    log.info("Synchronized lyrics value is invalid")
    return null
  }

  try {
    let timestamps = []
    let text = ""

    if (Array.isArray(value.synchronizedText)) {
      // Standard SYLT format
      log.info(
        `Standard SYLT format, number of synchronized texts: ${value.synchronizedText.length}`
      )
      for (const item of value.synchronizedText) {
        log.info("SYLT item:", {
          text: item.text,
          timeStamp: item.timeStamp,
        })
        if (item.text && typeof item.timeStamp === "number") {
          timestamps.push({
            time: item.timeStamp / 1000, // Convert to seconds
            text: item.text.trim(),
          })
          text += item.text.trim() + "\n"
        }
      }
    } else if (value.text && value.timeStamps) {
      // Other possible formats
      log.info("Text + timestamps format")
      const textLines = value.text.split("\n")
      const timeStamps = Array.isArray(value.timeStamps) ? value.timeStamps : []

      log.info(
        `Number of text lines: ${textLines.length}, Number of timestamps: ${timeStamps.length}`
      )

      for (let i = 0; i < Math.min(textLines.length, timeStamps.length); i++) {
        if (textLines[i].trim() && typeof timeStamps[i] === "number") {
          timestamps.push({
            time: timeStamps[i] / 1000,
            text: textLines[i].trim(),
          })
        }
      }
      text = value.text
    } else if (Array.isArray(value)) {
      // Some formats might be an array directly
      log.info(`Array format, length: ${value.length}`)
      for (const item of value) {
        if (
          item &&
          typeof item === "object" &&
          item.text &&
          typeof item.time === "number"
        ) {
          timestamps.push({
            time: item.time / 1000,
            text: item.text.trim(),
          })
          text += item.text.trim() + "\n"
        }
      }
    } else {
      // Trying other possible property names
      log.info("Checking other possible synchronized lyrics formats")
      const possibleKeys = ["lyrics", "lines", "entries", "items"]
      for (const key of possibleKeys) {
        if (Array.isArray(value[key])) {
          log.info(`Found ${key} array, length: ${value[key].length}`)
          for (const item of value[key]) {
            if (item && typeof item === "object") {
              const timeKey =
                item.time !== undefined
                  ? "time"
                  : item.timestamp !== undefined
                    ? "timestamp"
                    : item.timeStamp !== undefined
                      ? "timeStamp"
                      : null
              const textKey =
                item.text !== undefined
                  ? "text"
                  : item.lyric !== undefined
                    ? "lyric"
                    : item.content !== undefined
                      ? "content"
                      : null

              if (
                timeKey &&
                textKey &&
                typeof item[timeKey] === "number" &&
                typeof item[textKey] === "string"
              ) {
                timestamps.push({
                  time: item[timeKey] / 1000,
                  text: item[textKey].trim(),
                })
                text += item[textKey].trim() + "\n"
              }
            }
          }
          break
        }
      }
    }

    log.info(`Extracted ${timestamps.length} timestamps`)
    if (timestamps.length > 0) {
      const sortedTimestamps = timestamps.sort((a, b) => a.time - b.time)
      log.info(
        `Synchronized lyrics time range: ${sortedTimestamps[0].time}s - ${sortedTimestamps[sortedTimestamps.length - 1].time}s`
      )
      return {
        timestamps: sortedTimestamps,
        text: text.trim(),
      }
    }
  } catch (error) {
    console.error(
      `Failed to parse synchronized lyrics: ${error.message}`,
      error
    )
  }

  log.info("No valid synchronized lyrics found")
  return null
}

export function extractEmbeddedLyrics(metadata) {
  if (!metadata || !metadata.native) {
    return null
  }

  let embeddedLyrics = null
  // let allFoundTags = [];

  for (const [format, tags] of Object.entries(metadata.native)) {
    if (!Array.isArray(tags)) continue

    for (const tag of tags) {
      const tagId = tag.id ? tag.id.toUpperCase() : ""

      if (isLyricsTag(tagId, format)) {
        // allFoundTags.push({format, tagId, tag});

        if (
          tagId === "USLT" ||
          tagId === "LYRICS" ||
          tagId === "UNSYNCED LYRICS" ||
          tagId === "UNSYNCEDLYRICS" ||
          tagId === "©LYR" ||
          tagId === "LYR"
        ) {
          const lyricsText = extractLyricsText(tag.value)
          if (lyricsText) {
            embeddedLyrics = {
              type: "USLT",
              format: format,
              language: tag.value?.language || "unknown",
              description: tag.value?.description || "",
              text: lyricsText,
              synchronized: false,
            }
            break
          }
        } else if (
          tagId === "SYLT" ||
          tagId === "SYNCHRONIZED LYRICS" ||
          tagId === "SYNCEDLYRICS"
        ) {
          const syncLyrics = extractSynchronizedLyrics(tag.value)
          if (syncLyrics) {
            embeddedLyrics = {
              type: "SYLT",
              format: format,
              language: tag.value?.language || "unknown",
              description: tag.value?.description || "",
              text: syncLyrics.text,
              timestamps: syncLyrics.timestamps,
              synchronized: true,
            }
            break
          }
        } else if (tagId === "TXXX" && tag.value?.description) {
          const desc = tag.value.description.toUpperCase()
          if (
            desc.includes("LYRIC") ||
            desc.includes("歌词") ||
            desc.includes("LYRICS")
          ) {
            const lyricsText = tag.value.text
            if (
              lyricsText &&
              typeof lyricsText === "string" &&
              lyricsText.trim()
            ) {
              embeddedLyrics = {
                type: "TXXX",
                format: format,
                description: tag.value.description,
                text: lyricsText.trim(),
                synchronized: false,
              }
              break
            }
          }
        }
      }
    }
    if (embeddedLyrics) break
  }

  return embeddedLyrics
}

export function extractEmbeddedLyricsDebug(metadata) {
  log.info("extractEmbeddedLyrics: Starting lyric extraction.")

  if (!metadata || !metadata.native) {
    console.warn(
      "extractEmbeddedLyrics: No metadata or metadata.native found. Returning null."
    )
    return null
  }

  // Log all available native formats at the start
  log.info(
    `extractEmbeddedLyrics: Found native metadata. Checking formats: [${Object.keys(metadata.native).join(", ")}]`
  )

  let embeddedLyrics = null
  // let allFoundTags = [];

  for (const [format, tags] of Object.entries(metadata.native)) {
    // Group logs for each format to keep the console clean
    console.group(`extractEmbeddedLyrics: Checking format: ${format}`)

    if (!Array.isArray(tags)) {
      console.warn(
        `extractEmbeddedLyrics: Tags for format ${format} is not an array. Skipping.`
      )
      console.groupEnd() // Close group before continuing
      continue
    }

    log.info(`extractEmbeddedLyrics: Found ${tags.length} tags.`)

    for (const tag of tags) {
      const tagId = tag.id ? tag.id.toUpperCase() : ""

      // We only log tags that are identified as potential lyric tags
      if (isLyricsTag(tagId, format)) {
        log.info(
          `extractEmbeddedLyrics: Found potential lyrics tag. ID: '${tagId}'`
        )

        // Check for USLT (Unsynchronized)
        if (
          tagId === "USLT" ||
          tagId === "LYRICS" ||
          tagId === "UNSYNCED LYRICS" ||
          tagId === "UNSYNCEDLYRICS" ||
          tagId === "©LYR" ||
          tagId === "LYR"
        ) {
          log.info(
            `extractEmbeddedLyrics: Matched USLT-type tag. Attempting to extract text.`
          )
          const lyricsText = extractLyricsText(tag.value)
          if (lyricsText) {
            log.info(
              "extractEmbeddedLyrics: SUCCESS - Extracted unsynchronized lyrics."
            )
            embeddedLyrics = {
              type: "USLT",
              format: format,
              language: tag.value?.language || "unknown",
              description: tag.value?.description || "",
              text: lyricsText,
              synchronized: false,
            }
            break // Exit tag loop
          } else {
            console.warn(
              "extractEmbeddedLyrics: WARN - USLT tag was found but text extraction failed or returned empty."
            )
          }

          // Check for SYLT (Synchronized)
        } else if (
          tagId === "SYLT" ||
          tagId === "SYNCHRONIZED LYRICS" ||
          tagId === "SYNCEDLYRICS"
        ) {
          log.info(
            `extractEmbeddedLyrics: Matched SYLT-type tag. Attempting to extract text.`
          )
          const syncLyrics = extractSynchronizedLyrics(tag.value)
          if (syncLyrics) {
            log.info(
              "extractEmbeddedLyrics: SUCCESS - Extracted synchronized lyrics."
            )
            embeddedLyrics = {
              type: "SYLT",
              format: format,
              language: tag.value?.language || "unknown",
              description: tag.value?.description || "",
              text: syncLyrics.text,
              timestamps: syncLyrics.timestamps,
              synchronized: true,
            }
            break // Exit tag loop
          } else {
            console.warn(
              "extractEmbeddedLyrics: WARN - SYLT tag was found but extraction failed or returned empty."
            )
          }

          // Check for TXXX (User-defined)
        } else if (tagId === "TXXX" && tag.value?.description) {
          log.info(
            `extractEmbeddedLyrics: Matched TXXX tag with description: '${tag.value.description}'`
          )
          const desc = tag.value.description.toUpperCase()
          if (
            desc.includes("LYRIC") ||
            desc.includes("歌词") ||
            desc.includes("LYRICS")
          ) {
            log.info(
              "extractEmbeddedLyrics: TXXX description matches lyrics keywords."
            )
            const lyricsText = tag.value.text
            if (
              lyricsText &&
              typeof lyricsText === "string" &&
              lyricsText.trim()
            ) {
              log.info(
                "extractEmbeddedLyrics: SUCCESS - Extracted TXXX lyrics."
              )
              embeddedLyrics = {
                type: "TXXX",
                format: format,
                description: tag.value.description,
                text: lyricsText.trim(),
                synchronized: false,
              }
              break // Exit tag loop
            } else {
              console.warn(
                "extractEmbeddedLyrics: WARN - TXXX tag matched keywords but its text was empty or invalid."
              )
            }
          }
        }
      }
    } // End tag loop

    if (embeddedLyrics) {
      log.info(
        `extractEmbeddedLyrics: Lyrics found in format ${format}. Stopping search.`
      )
      console.groupEnd() // Close group before breaking
      break // Exit format loop
    }

    console.groupEnd() // Close group for this format
  } // End format loop

  if (embeddedLyrics) {
    log.info(
      "extractEmbeddedLyrics: Finished. Returning embedded lyrics object:",
      embeddedLyrics
    )
  } else {
    log.info(
      "extractEmbeddedLyrics: Finished. No embedded lyrics were found after checking all formats."
    )
  }

  return embeddedLyrics
}
