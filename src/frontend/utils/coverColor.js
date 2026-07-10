// Canvas-based dominant color extraction for adaptive PlayerBar tinting.
// coverDataUrl is always a same-origin `data:` URL, so canvas readback never taints.

const cache = new Map()

/**
 * @param {string|null|undefined} dataUrl
 * @returns {Promise<{r: number, g: number, b: number} | null>}
 */
export async function extractCoverColor(dataUrl) {
  if (!dataUrl) return null
  if (cache.has(dataUrl)) return cache.get(dataUrl)

  const color = await new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const size = 32
        const canvas = document.createElement("canvas")
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        let r = 0
        let g = 0
        let b = 0
        const pixelCount = data.length / 4
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
        }
        resolve({
          r: Math.round(r / pixelCount),
          g: Math.round(g / pixelCount),
          b: Math.round(b / pixelCount),
        })
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })

  cache.set(dataUrl, color)
  return color
}
