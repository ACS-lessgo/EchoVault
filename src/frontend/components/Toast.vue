<template>
  <div v-if="visible" :class="['toast', type]">{{ message }}</div>
</template>

<script setup>
import { ref, onMounted } from "vue"

const visible = ref(false)
const message = ref("")
const type = ref("info")

onMounted(() => {
  document.addEventListener("show-toast", (e) => {
    message.value = e.detail.message
    type.value = e.detail.type
    visible.value = true
    setTimeout(() => (visible.value = false), 4000)
  })
})
</script>

<style scoped>
.toast {
  position: fixed;
  bottom: 100px;
  right: 20px;
  background: var(--accent);
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
  transition: opacity 0.3s ease;
  font-weight: 500;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInOut 4s ease forwards;
}
.toast.error {
  background: #e74c3c;
}
.toast.info {
  background: #3498db;
}
.toast.success {
  background: #2ecc71;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  10%,
  90% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(20px);
  }
}
</style>
