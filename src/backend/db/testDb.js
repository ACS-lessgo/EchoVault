import { initDB } from "./index.js"

export function createTestDb() {
  return initDB(":memory:")
}
