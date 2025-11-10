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
    <Toast />
  </div>
</template>

<script setup>
import TopBar from "./components/TopBar.vue"
import SideNav from "./components/SideNav.vue"
import PlayerBar from "./components/PlayerBar.vue"
import Toast from "./components/Toast.vue"
</script>

<style>
/* Global layout – root structure, main layout, and theme-specific scrollbar styles */

/* Root structure and body setup */
html,
body,
#app {
  height: 100%;
  margin: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Main layout wrapper (between top bar and player bar) */
.main-layout {
  display: flex;
  flex: 1;
  height: calc(100vh - 70px - 80px); /* subtract topbar + playerbar height */
  background-color: var(--bg-color);
  overflow: hidden;
  max-height: 100vh;
}

/* Content area */
.content-area {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background-color: var(--content-bg);
  color: var(--text-color);
}

/* Dark theme scrollbar */
:root[data-theme="dark"] ::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

:root[data-theme="dark"] ::-webkit-scrollbar-track {
  background: #1a1a1a;
}

:root[data-theme="dark"] ::-webkit-scrollbar-thumb {
  background-color: #444;
  border: 2px solid #1a1a1a;
}

:root[data-theme="dark"] ::-webkit-scrollbar-thumb:hover {
  background-color: #666;
}

/* Light theme scrollbar */
:root[data-theme="light"] ::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

:root[data-theme="light"] ::-webkit-scrollbar-track {
  background: #eaeaea;
}

:root[data-theme="light"] ::-webkit-scrollbar-thumb {
  background-color: #b5b5b5;
  border: 2px solid #eaeaea;
}

:root[data-theme="light"] ::-webkit-scrollbar-thumb:hover {
  background-color: #999;
}
</style>
