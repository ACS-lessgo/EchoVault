<template>
  <div id="app">
    <TopBar />

    <div class="main-layout">
      <SideNav />
      <main class="content-area">
        <router-view />
      </main>
    </div>

    <PlayerBar />
  </div>
</template>

<script setup>
import TopBar from "./components/TopBar.vue"
import SideNav from "./components/SideNav.vue"
import PlayerBar from "./components/PlayerBar.vue"
</script>

<style>
/* Prevent the body from scrolling */
html,
body,
#app {
  height: 100%;
  margin: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-layout {
  display: flex;
  flex: 1;
  height: calc(100vh - 70px - 80px); /* minus topbar + playerbar */
  background-color: var(--bg-color);
  overflow: hidden;
  max-height: 100vh;
}

.content-area {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background-color: var(--content-bg);
  color: var(--text-color);
}

/* Dark Scrollbar */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #1a1a1a;
}

::-webkit-scrollbar-thumb {
  background-color: #444;
  border: 2px solid #1a1a1a;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #666;
}
</style>
