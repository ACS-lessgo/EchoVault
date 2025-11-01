<template>
  <header class="top-bar">
    <div class="search-bar">
      <img :src="Search" alt="Search icon" class="search-icon" />
      <input type="text" placeholder="Search... " class="search-input" />
    </div>
    <div class="actions">
      <button title="Theme">
        <img class="topbar-icon-class icon-btn" :src="Light" alt="Light" />
      </button>
      <button title="Settings">
        <img
          class="topbar-icon-class icon-btn"
          :src="Settings"
          alt="Settings"
        />
      </button>
    </div>
  </header>
</template>

<script setup>
import { Light, Settings, Search } from "../assests/icons/icons.js"
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

.icon-btn:hover {
  transform: scale(1.3);
  transition: transform 0.2s ease-in-out;
}
</style>
