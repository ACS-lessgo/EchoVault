import { defineStore } from "pinia"
import { ref } from "vue"

export const useUpdateStore = defineStore("update", () => {
  const available = ref(false)
  const version = ref("")
  const url = ref("")
  const checked = ref(false)

  function setResult(result) {
    available.value = Boolean(result?.available)
    version.value = result?.version || ""
    url.value = result?.url || ""
    checked.value = true
  }

  async function checkNow() {
    const result = await window.api.checkForUpdates()
    setResult(result)
    return result
  }

  return { available, version, url, checked, setResult, checkNow }
})
