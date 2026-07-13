import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "backend",
          environment: "node",
          include: ["src/backend/**/*.test.js", "src/main.test.js"],
        },
      },
      {
        test: {
          name: "frontend",
          environment: "jsdom",
          include: ["src/frontend/**/*.{test,spec}.js"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/backend/**/*.js", "src/frontend/**/*.js", "src/main.js"],
      exclude: [
        "src/backend/**/*.test.js",
        "src/frontend/**/*.{test,spec}.js",
        "src/backend/main/enhance.js",
        "src/backend/main/downloader.js",
      ],
    },
  },
})
