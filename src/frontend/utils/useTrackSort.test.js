import { describe, it, expect, beforeEach } from "vitest"
import { ref, nextTick } from "vue"
import { useTrackSort, SORT_FIELDS } from "./useTrackSort.js"

const tracks = [
  { title: "Bravo", artist: "Zeta", album: "M", duration: 200 },
  { title: "Alpha", artist: "Yankee", album: "N", duration: 100 },
  { title: "Charlie", artist: "Xray", album: "O", duration: 300 },
]

describe("useTrackSort", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("exposes the known sort fields", () => {
    expect(SORT_FIELDS).toEqual(["default", "name", "artist", "album", "duration"])
  })

  it("defaults to unsorted 'default' field/asc direction when nothing is stored", () => {
    const { sortField, sortDirection, sortedTracks } = useTrackSort(ref(tracks), "sort-key")
    expect(sortField.value).toBe("default")
    expect(sortDirection.value).toBe("asc")
    expect(sortedTracks.value).toEqual(tracks)
  })

  it("restores a previously persisted sort field/direction", () => {
    localStorage.setItem("sort-key", JSON.stringify({ field: "artist", direction: "desc" }))
    const { sortField, sortDirection } = useTrackSort(ref(tracks), "sort-key")
    expect(sortField.value).toBe("artist")
    expect(sortDirection.value).toBe("desc")
  })

  it("sorts by title (mapped from the 'name' field) ascending", () => {
    const { sortedTracks, setSortField } = useTrackSort(ref(tracks), "sort-key")
    setSortField("name")
    expect(sortedTracks.value.map((t) => t.title)).toEqual(["Alpha", "Bravo", "Charlie"])
  })

  it("sorts by duration descending", () => {
    const { sortedTracks, setSortField, setSortDirection } = useTrackSort(ref(tracks), "sort-key")
    setSortField("duration")
    setSortDirection("desc")
    expect(sortedTracks.value.map((t) => t.duration)).toEqual([300, 200, 100])
  })

  it("does not mutate the source array", () => {
    const source = ref([...tracks])
    const { setSortField } = useTrackSort(source, "sort-key")
    setSortField("album")
    expect(source.value).toEqual(tracks)
  })

  it("persists field/direction changes to localStorage", async () => {
    const { setSortField, setSortDirection } = useTrackSort(ref(tracks), "sort-key")
    setSortField("album")
    setSortDirection("desc")
    await nextTick()
    expect(JSON.parse(localStorage.getItem("sort-key"))).toEqual({
      field: "album",
      direction: "desc",
    })
  })
})
