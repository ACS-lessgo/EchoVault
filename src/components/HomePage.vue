<template>
  <div class="home-page">
    <!-- Hero Section -->
    <div class="hero-card">
      <div class="hero-text">
        <h1>Welcome to <span class="highlight">EchoVault</span></h1>
      </div>
      <div class="wave">
        <div class="bar" v-for="n in 10" :key="n"></div>
      </div>
    </div>

    <!-- Content Card -->
    <div class="content-card">
      <div class="add-section">
        <h2>Add Music</h2>
        <div class="button-group">
          <button class="accent-btn">Add Folder</button>
          <button class="accent-btn">Add Music Files</button>
        </div>
      </div>

      <div class="table-section">
        <h2>Music Folders</h2>
        <table class="folder-table">
          <thead>
            <tr>
              <th>Folder Path</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>D:/Music/Pop</td>
              <td><button class="remove-btn">Remove</button></td>
            </tr>
            <tr>
              <td>C:/Users/John/Music/Rock</td>
              <td><button class="remove-btn">Remove</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="rescan-section">
        <button class="rescan-btn">Rescan Library</button>
      </div>
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.home-page {
  color: var(--text-color);
  padding: 2rem;
  background-color: var(--content-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

/* ---------- HERO SECTION ---------- */
.hero-card {
  width: 85%;
  background: linear-gradient(135deg, #2d0b5d, #6b23a8, #8e44ad);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  animation: fadeIn 0.8s ease;
}

.hero-text h1 {
  font-size: 2rem;
  font-weight: 700;
}

.hero-text .highlight {
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.6);
}

.hero-text p {
  margin-top: 0.5rem;
  color: #ddd;
}

/* Animated wave bars */
.wave {
  display: flex;
  align-items: flex-end;
  height: 50px;
  gap: 4px;
}

.bar {
  width: 6px;
  height: 20px;
  background-color: white;
  border-radius: 3px;
  animation: waveAnim 1s ease-in-out infinite;
}

.bar:nth-child(odd) {
  animation-delay: 0.2s;
}
.bar:nth-child(even) {
  animation-delay: 0.4s;
}

@keyframes waveAnim {
  0%,
  100% {
    height: 10px;
    opacity: 0.6;
  }
  50% {
    height: 45px;
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ---------- CONTENT CARD ---------- */
.content-card {
  background-color: var(--side-nav-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  width: 85%;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.add-section,
.table-section,
.rescan-section {
  margin-bottom: 2rem;
  text-align: center;
}

h2 {
  color: var(--accent);
  margin-bottom: 1rem;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.accent-btn {
  background-color: var(--accent);
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;
  overflow: hidden;
}

.accent-btn:hover {
  background-color: var(--accent-hover);
}

.accent-btn::after {
  content: "";
  position: absolute;
  left: -100%;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.15);
  transition: left 0.3s;
}

.accent-btn:hover::after {
  left: 0;
}

.folder-table {
  width: 80%;
  margin: 0 auto;
  border-collapse: collapse;
  border-radius: 10px;
  overflow: hidden;
  background-color: var(--topbar-bg);
}

.folder-table th,
.folder-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  text-align: left;
}

.remove-btn {
  background-color: transparent;
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.remove-btn:hover {
  background-color: var(--accent);
  color: white;
}

.rescan-btn {
  background-color: var(--topbar-bg);
  border: 1px solid var(--accent);
  color: var(--text-color);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}

.rescan-btn:hover {
  background-color: var(--accent);
  color: white;
}
</style>
