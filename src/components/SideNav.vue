<template>
  <aside class="side-nav">
    <nav>
      <router-link to="/" class="nav-item">
        <i class="fas fa-home nav-icon"></i>
        <span>Home</span>
      </router-link>

      <router-link to="/songs" class="nav-item">
        <i class="fas fa-music nav-icon"></i>
        <span>All Songs</span>
      </router-link>

      <router-link to="/artists" class="nav-item">
        <i class="fas fa-user nav-icon"></i>
        <span>Artists</span>
      </router-link>

      <router-link to="/library" class="nav-item">
        <i class="fas fa-database nav-icon"></i>
        <span>Library Info</span>
      </router-link>

      <router-link to="/playlists" class="nav-item">
        <i class="fas fa-list nav-icon"></i>
        <span>Playlists</span>
      </router-link>
    </nav>
  </aside>
</template>

<style scoped>
.side-nav {
  width: 220px;
  background-color: var(--side-nav-bg);
  color: var(--text-color);
  border-right: 2px solid var(--border-color);
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #ccc;
  padding: 8px 10px;
  border-radius: 8px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.nav-item:hover {
  background-color: var(--hover-bg);
  color: white;
}

.nav-item.router-link-active {
  background-color: var(--hover-bg);
}

.nav-icon {
  width: 20px;
  height: 20px;
  filter: invert(100%) brightness(200%);
}
</style>
