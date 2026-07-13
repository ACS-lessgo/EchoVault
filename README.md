# EchoVault 

[![License](https://img.shields.io/github/license/EchoVaultHQ/EchoVault)](LICENSE)
[![Release](https://img.shields.io/github/v/release/EchoVaultHQ/EchoVault)](https://github.com/EchoVaultHQ/EchoVault/releases)
[![Downloads](https://img.shields.io/github/downloads/EchoVaultHQ/EchoVault/total)](https://github.com/EchoVaultHQ/EchoVault/releases)
[![Stars](https://img.shields.io/github/stars/EchoVaultHQ/EchoVault)](https://github.com/EchoVaultHQ/EchoVault)

A modern, high-fidelity music player built with **Electron**, **Vite**, and **Vue**.  
EchoVault is designed to provide a clean, responsive interface and rich playback features for local lossless audio collections.

## Related Projects

- **EchoVault CLI** — Official command-line interface for EchoVault.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Screenshots](#screenshots)
4. [Installation (Development)](#installation-development)
5. [Available Commands](#available-commands)
6. [Build & Distribution](#build--distribution)
7. [Project Structure](#project-structure)
8. [Contribute](#fork-this-repository)

---

## Overview

EchoVault is the flagship desktop application of the EchoVault ecosystem.
The project is maintained under the EchoVaultHQ GitHub organization alongside official tools such as EchoVault CLI.

---

## Features

### Playback

- FLAC
- WAV
- ALAC
- MP3

### Library

- Automatic library scanning
- Metadata indexing
- Instant startup through local caching

### Interface

- Mini Player
- Light & Dark themes
- Multiple color schemes
- Responsive desktop UI

### Platform Support

- Windows
- Linux

---

## Screenshots

### Dark theme

<details>

#### Home Page

![Home](screenshots/home.png)

#### All Songs

![Main Player View](screenshots/all-songs.png)

#### Artists

![Artists](screenshots/artists-page.png)

#### Mini Player

![Mini Player Overlay](screenshots/m-player.png)

#### User library information

![Library Information](screenshots/library-view.png)

#### Songs Queue

![Queue Information](screenshots/queue.png)

#### Color schemes and theme

![Color Schemes](screenshots/colors-n-themes.png)

</details>

### Light theme

<details>

#### Home Page

![Home](screenshots/lighttheme/home.png)

#### All Songs

![Main Player View](screenshots/lighttheme/all-songs.png)

#### Artists

![Artists](screenshots/lighttheme/artists.png)

#### Mini Player

![Mini Player Overlay](screenshots/m-player.png)

#### User library information

![Library Information](screenshots/lighttheme/library-view.png)

#### Songs Queue

![Queue Information](screenshots/lighttheme/queue.png)

#### Color schemes and theme

![Color Schemes](screenshots/lighttheme/colors-n-themes.png)

</details>

## Installation (Development)

Follow these steps to clone the repository and set up your development environment.

### 1. Clone the repository

```bash
git clone https://github.com/ACS-lessgo/EchoVault.git
cd EchoVault
```

2. Select the development branch

```bash

git checkout release/v1.0.0
```

3. Install dependencies
   Make sure you have Node.js (v18 or higher) and npm installed, then run:

```bash

npm install
```

4. Start the development environment
   This will start the Vite renderer and Electron main process:

```bash

npm run start
```

After the build completes, an Electron window should open automatically.

### Available Commands

Command Description

```bash
npm run start | Run EchoVault in development mode using Vite + Electron
npm run lint | Lint the project using ESLint
npm run make | Build and package the app for your current platform
npm run publish | Package and publish to GitHub Releases (requires GITHUB_TOKEN)
npm run package | Create a distributable package without publishing
```

## Build & Distribution

To create a packaged release version for your OS:

```bash
npm run make
```

Output builds are generated in:

```bash
out/make/
```

Typical build outputs:

Windows: .exe installer

Linux: .AppImage and .deb

If you want to publish directly to GitHub Releases:

```bash
export GITHUB_TOKEN=your_token_here
npm run publish
```

## Project Structure

```bash
EchoVault/
├── src/
│ ├── main.js # Electron main process
│ ├── preload.js # Preload scripts
│ ├── frontend/ # Vite + Vue app source
│ ├── backend/ # Local DB and playback utilities
│ └── assets/ # Icons, media, and static files
│
├── forge.config.js # Electron Forge configuration
├── vite.main.config.mjs # Vite configuration for main process
├── vite.renderer.config.mjs # Vite configuration for renderer
├── package.json
├── RELEASE_NOTES.md
└── README.md
```

## License

This project is licensed under the MIT License.

## Fork this repository

Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

Commit your changes:

```bash
git commit -m "Added new feature: your description"
```

Push the branch and open a Pull Request :)
