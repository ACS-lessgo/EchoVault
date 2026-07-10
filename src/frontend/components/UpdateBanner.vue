<template>
  <div v-if="visible" class="update-banner">
    <span>{{ t("update.available", { version }) }}</span>
    <div class="update-banner-actions">
      <button class="update-banner-download" @click="download">
        {{ t("update.download") }}
      </button>
      <button class="update-banner-dismiss" @click="dismiss">
        {{ t("update.dismiss") }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { useI18n } from "vue-i18n"
import { useUpdateStore } from "../store/update.js"

const { t } = useI18n()
const updateStore = useUpdateStore()

const DISMISSED_KEY = "echovault-dismissed-update"

const dismissedVersion = ref(localStorage.getItem(DISMISSED_KEY))
const version = computed(() => updateStore.version)
const visible = computed(
  () => updateStore.available && version.value !== dismissedVersion.value
)

function download() {
  window.api.openExternal(updateStore.url)
}

function dismiss() {
  dismissedVersion.value = version.value
  localStorage.setItem(DISMISSED_KEY, version.value)
}
</script>

<style scoped>
.update-banner {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--accent);
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
  font-weight: 500;
}

.update-banner-actions {
  display: flex;
  gap: 8px;
}

.update-banner-download,
.update-banner-dismiss {
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  font-weight: 500;
}

.update-banner-download {
  background: white;
  color: var(--accent);
}

.update-banner-dismiss {
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.6);
}
</style>
