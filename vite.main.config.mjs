import { defineConfig } from "vite"
import { resolve } from "path"
import fs from "fs"

export default defineConfig({
  build: {
    sourcemap: "inline",
    rollupOptions: {
      external: ["better-sqlite3", "fs", "path", "os"],
    },
  },
  plugins: [
    {
      name: "copy-schema",
      closeBundle() {
        // schema.sql file is copied to build folder (doing it manullay as vite not able recognize it)
        const src = resolve(__dirname, "src/backend/db/schema.sql")
        const dest = resolve(__dirname, ".vite/build/schema.sql")

        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest)
          console.log("Copied schema.sql to build folder")
        } else {
          console.warn("schema.sql not found at:", src)
        }
      },
    },
  ],
})
