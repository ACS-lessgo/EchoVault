import { defineStore } from "pinia"
import { ref } from "vue"

export const useLastfmStore = defineStore("lastfm", () => {
  const hasCredentials = ref(false)
  const connected = ref(false)
  const username = ref(null)
  const scrobblingEnabled = ref(false)
  const authPending = ref(false)
  const error = ref(null)

  async function fetchStatus() {
    const status = await window.api.lastfmGetStatus()
    hasCredentials.value = status.hasCredentials
    connected.value = status.connected
    username.value = status.username
    scrobblingEnabled.value = status.scrobblingEnabled
  }

  async function saveCredentials(apiKey, apiSecret) {
    error.value = null
    const result = await window.api.lastfmSaveCredentials(apiKey, apiSecret)
    if (!result.ok) {
      error.value = result.error
      return
    }
    await fetchStatus()
  }

  async function connect() {
    error.value = null
    const result = await window.api.lastfmConnect()
    if (!result.ok) {
      error.value = result.error
      return
    }
    authPending.value = true
  }

  async function confirmAuth() {
    error.value = null
    const result = await window.api.lastfmConfirmAuth()
    if (!result.ok) {
      error.value = result.error
      return
    }
    authPending.value = false
    await fetchStatus()
  }

  async function disconnect() {
    await window.api.lastfmDisconnect()
    authPending.value = false
    await fetchStatus()
  }

  async function toggleEnabled() {
    await window.api.lastfmSetEnabled(!scrobblingEnabled.value)
    await fetchStatus()
  }

  return {
    hasCredentials,
    connected,
    username,
    scrobblingEnabled,
    authPending,
    error,
    fetchStatus,
    saveCredentials,
    connect,
    confirmAuth,
    disconnect,
    toggleEnabled,
  }
})
