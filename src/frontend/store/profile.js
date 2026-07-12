import { defineStore } from "pinia"
import { ref } from "vue"

export const useProfileStore = defineStore("profile", () => {
  const username = ref(localStorage.getItem("username") || "")

  function setUsername(name) {
    username.value = name.trim()
    localStorage.setItem("username", username.value)
  }

  return { username, setUsername }
})
