<template>
  <header class="top-bar">
    <div class="search-bar">
      <img :src="Search" alt="Search icon" class="search-icon" />
      <input type="text" placeholder="Search... " class="search-input" />
    </div>
    <div class="actions">
      <button title="Theme" @click="toggleTheme" class="icon-btn">
        <img
          class="topbar-icon-class"
          :src="isDarkMode ? Light : Dark"
          alt="Light"
        />
      </button>
      <button title="Settings" class="icon-btn">
        <img class="topbar-icon-class" :src="Settings" alt="Settings" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref } from "vue"
import { Dark, Light, Settings, Search } from "../assests/icons/icons.js"

const isDarkMode = ref(true)

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
}
</script>

<style scoped>
.top-bar {
  background-color: var(--topbar-bg);
  color: var(--text-color);
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  border-bottom: 2px solid var(--border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.actions button {
  margin-left: 0.5rem;
  background: transparent;
  font-size: 1.2rem;
  cursor: pointer;
}

.topbar-icon-class {
  width: 18px;
  height: 18px;
  filter: invert(100%) brightness(200%);
}

.search-bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background-color: var(--search-bar-color);
  color: var(--text-color);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  width: 50%;
  margin: 0 auto;
}

.search-icon {
  width: 16px;
  height: 16px;
  filter: invert(100%) brightness(200%);
  margin-right: 0.5rem;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: whitesmoke;
  font-size: 0.9rem;
}

.search-input::placeholder {
  color: var(--muted-text);
}

.icon-btn {
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
  justify-content: center;
}

.icon-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}
</style>
