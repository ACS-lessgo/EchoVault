import { defineStore } from "pinia"
import { ref } from "vue"

export const useSearchStore = defineStore("search", () => {
  const query = ref("")
  function setQuery(val) {
    query.value = val
  }
  return { query, setQuery }
})
