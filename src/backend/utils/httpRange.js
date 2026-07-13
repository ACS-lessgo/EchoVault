export function parseRange(rangeHeader, fileSize) {
  if (!rangeHeader) {
    return { status: 200, start: 0, end: fileSize - 1 }
  }

  const match = rangeHeader.match(/bytes=(\d*)-(\d*)/)
  let start = match?.[1] ? parseInt(match[1], 10) : 0
  let end = match?.[2] ? parseInt(match[2], 10) : fileSize - 1
  if (isNaN(start) || start < 0) start = 0
  if (isNaN(end) || end >= fileSize) end = fileSize - 1

  if (start > end) {
    return { status: 416 }
  }

  return { status: 206, start, end }
}
