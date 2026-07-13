# EchoVault Test Coverage — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the test tooling (Vitest for unit/component, Playwright for E2E), wire it into npm scripts and CI, and port the three existing hand-rolled `test_*.mjs` self-check scripts into real, CI-enforced Vitest specs — with zero behavior changes to production code.

**Architecture:** A single `vitest.config.mjs` at the repo root defines two Vitest "projects" sharing one config: `backend` (`environment: "node"`, covers `src/backend/**` and `src/main.js`) and `frontend` (`environment: "jsdom"`, covers `src/frontend/**`). Test files are co-located with source (`foo.test.js` next to the module). A separate `playwright.config.js` points at a new top-level `e2e/` directory for later phases. A GitHub Actions workflow runs `npm run test:coverage` on push/PR to `main`.

**Tech Stack:** Vitest 4.x, @vitest/coverage-v8, @vue/test-utils, jsdom, @playwright/test (installed now, exercised starting Phase 4).

## Global Constraints

- Node version for all tooling/CI: **v20.20.2** (from `.nvmrc`), matched exactly in the GitHub Actions workflow.
- No behavior changes to production code in this phase — this is tooling setup + porting existing checks only.
- Do not touch `forge.config.js` `packagerConfig` (explicitly marked `// IMP : dont touch the packagerConfig` in the file) or any of the three Vite build configs (`vite.main.config.mjs`, `vite.preload.config.mjs`, `vite.renderer.config.mjs`).
- Logging convention project-wide: `electron-log`, tagged `"<module> :: <message>"` — not applicable to test files themselves, only if touching production code.
- This phase does **not** enforce a coverage threshold and does **not** wire a Playwright E2E job into CI — those are explicitly deferred to Phase 4, once real E2E specs and a packaging step exist to run them against. Running `npm run test:e2e` after this phase reports "no test files found" — that is expected, not a failure, until Phase 4.

---

### Task 1: Install test tooling dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `vitest`, `@vitest/coverage-v8`, `@vue/test-utils`, `jsdom`, `@playwright/test` available as devDependencies for all later tasks.

- [ ] **Step 1: Install the packages**

Run:
```bash
npm install -D vitest @vitest/coverage-v8 @vue/test-utils jsdom @playwright/test
```

- [ ] **Step 2: Verify they landed in `package.json`**

Run: `node -e "const p = require('./package.json'); console.log(['vitest','@vitest/coverage-v8','@vue/test-utils','jsdom','@playwright/test'].every(d => p.devDependencies[d]))"`
Expected: `true`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "test: install vitest, playwright, and component-testing dependencies"
```

---

### Task 2: Vitest config with backend/frontend projects

**Files:**
- Create: `vitest.config.mjs`

**Interfaces:**
- Consumes: nothing (first config file).
- Produces: `backend` project (`environment: "node"`, matches `src/backend/**/*.test.js` and `src/main.test.js`) and `frontend` project (`environment: "jsdom"`, matches `src/frontend/**/*.{test,spec}.js`) that every later test-writing task targets by file location alone — no per-test config needed.

- [ ] **Step 1: Create `vitest.config.mjs`**

```js
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
```

The `enhance.js`/`downloader.js` coverage exclusion reflects the plan's explicit scope exclusion (external binary spawn + network download) — revisit this list in Phase 2 once their pure helpers are extracted and tested.

- [ ] **Step 2: Run Vitest to confirm the config loads**

Run: `npx vitest run`
Expected: Vitest starts, reports both `backend` and `frontend` projects, then exits non-zero with "No test files found" (no `*.test.js`/`*.spec.js` files exist yet — expected at this point).

- [ ] **Step 3: Commit**

```bash
git add vitest.config.mjs
git commit -m "test: add vitest config with backend/frontend projects"
```

---

### Task 3: Port `lrcParser` self-check to Vitest

**Files:**
- Create: `src/backend/utils/lrcParser.test.js`

**Interfaces:**
- Consumes: `parseLrc` from `src/backend/utils/lrcParser.js` (existing, unchanged — exported function, no fetch/IO dependency).
- Produces: first real spec file, proving the `backend` Vitest project picks up and runs `.test.js` files correctly.

- [ ] **Step 1: Write the test file**

```js
import { describe, it, expect } from "vitest"
import { parseLrc } from "./lrcParser.js"

describe("parseLrc", () => {
  it("computes endTime as Infinity for a single timestamp line", () => {
    const result = parseLrc("[00:12.00]Hello world")
    expect(result.timestamps).toEqual([
      { startTime: 12, text: "Hello world", endTime: Infinity },
    ])
    expect(result.synchronized).toBe(true)
  })

  it("computes endTime from the next entry's startTime for multi-timestamp lines", () => {
    const result = parseLrc("[00:12.00][00:45.00]Hello world")
    expect(result.timestamps).toEqual([
      { startTime: 12, text: "Hello world", endTime: 45 },
      { startTime: 45, text: "Hello world", endTime: Infinity },
    ])
  })

  it("returns null for a metadata-only file", () => {
    const result = parseLrc("[ar:Some Artist]\n[ti:Some Title]\n[by:Someone]")
    expect(result).toBeNull()
  })

  it("strips a leading BOM before parsing", () => {
    const result = parseLrc("﻿[00:01.500]First line\n[00:03.250]Second line")
    expect(result.timestamps).toEqual([
      { startTime: 1.5, text: "First line", endTime: 3.25 },
      { startTime: 3.25, text: "Second line", endTime: Infinity },
    ])
  })
})
```

- [ ] **Step 2: Run it**

Run: `npx vitest run src/backend/utils/lrcParser.test.js`
Expected: PASS, 4 tests, project `backend`.

- [ ] **Step 3: Commit**

```bash
git add src/backend/utils/lrcParser.test.js
git commit -m "test: port lrcParser self-check to vitest"
```

---

### Task 4: Port `lastfmClient` self-check to Vitest

**Files:**
- Create: `src/backend/utils/lastfmClient.test.js`

**Interfaces:**
- Consumes: `buildSignature`, `getToken`, `getSession`, `updateNowPlaying`, `scrobble` from `src/backend/utils/lastfmClient.js` (existing, unchanged).
- Produces: the `vi.stubGlobal("fetch", ...)` / `vi.unstubAllGlobals()` pattern used here is the template later backend tasks (Phase 2) reuse for any other `fetch`-based client.

- [ ] **Step 1: Write the test file**

```js
import { describe, it, expect, afterEach, vi } from "vitest"
import crypto from "node:crypto"
import {
  buildSignature,
  getToken,
  getSession,
  updateNowPlaying,
  scrobble,
} from "./lastfmClient.js"

const credentials = { apiKey: "testkey", apiSecret: "testsecret" }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("buildSignature", () => {
  it("matches Last.fm's documented algorithm: sort keys, concat key+value pairs, append secret, MD5", () => {
    const params = { method: "auth.getsession", api_key: "testkey", token: "abc" }
    const expected = crypto
      .createHash("md5")
      .update("api_keytestkeymethodauth.getsessiontokenabctestsecret", "utf8")
      .digest("hex")
    expect(buildSignature(params, "testsecret")).toBe(expected)
  })
})

describe("getToken", () => {
  it("returns the token on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ token: "tok123" }) })),
    )
    const result = await getToken(credentials)
    expect(result.ok).toBe(true)
    expect(result.token).toBe("tok123")
  })

  it("surfaces a network error as a non-ok result instead of throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down")
      }),
    )
    const result = await getToken(credentials)
    expect(result.ok).toBe(false)
    expect(result.error).toBe("network down")
  })
})

describe("getSession", () => {
  it("returns sessionKey and username on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ session: { key: "sk123", name: "testuser" } }),
      })),
    )
    const result = await getSession(credentials, "tok123")
    expect(result.ok).toBe(true)
    expect(result.sessionKey).toBe("sk123")
    expect(result.username).toBe("testuser")
  })

  it("returns ok:false with the API's message on an unauthorized token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: 14, message: "Unauthorized Token" }),
      })),
    )
    const result = await getSession(credentials, "bad-token")
    expect(result.ok).toBe(false)
    expect(result.error).toBe("Unauthorized Token")
  })
})

describe("updateNowPlaying and scrobble", () => {
  it("POST signed params using the per-user credentials, not a shared app key", async () => {
    let capturedBody
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, opts) => {
        capturedBody = opts.body
        return { ok: true, json: async () => ({}) }
      }),
    )

    await updateNowPlaying(credentials, "sk123", { artist: "A", title: "B", duration: 200 })
    expect(capturedBody.toString()).toContain("method=track.updatenowplaying")
    expect(capturedBody.toString()).toContain("api_key=testkey")
    expect(capturedBody.toString()).toContain("sk=sk123")

    await scrobble(credentials, "sk123", { artist: "A", title: "B" }, 1700000000)
    expect(capturedBody.toString()).toContain("method=track.scrobble")
    expect(capturedBody.toString()).toContain("timestamp=1700000000")
  })
})
```

- [ ] **Step 2: Run it**

Run: `npx vitest run src/backend/utils/lastfmClient.test.js`
Expected: PASS, 6 tests, project `backend`.

- [ ] **Step 3: Commit**

```bash
git add src/backend/utils/lastfmClient.test.js
git commit -m "test: port lastfmClient self-check to vitest"
```

---

### Task 5: Port `lrclibClient` self-check to Vitest

**Files:**
- Create: `src/backend/utils/lrclibClient.test.js`

**Interfaces:**
- Consumes: `fetchLyricsFromLrclib` from `src/backend/utils/lrclibClient.js` (existing, unchanged — note it imports `src/logger.js`, which wraps `electron-log/main` and has been confirmed to load correctly outside an Electron runtime, so no mocking of the logger is needed).
- Produces: nothing consumed by later tasks; completes the three-script port.

- [ ] **Step 1: Write the test file**

```js
import { describe, it, expect, afterEach, vi } from "vitest"
import { fetchLyricsFromLrclib } from "./lrclibClient.js"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("fetchLyricsFromLrclib", () => {
  it("returns parsed lyrics on a successful match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ syncedLyrics: "[00:01.00]Hello\n[00:02.00]World" }),
      })),
    )
    const { lyrics, reason } = await fetchLyricsFromLrclib({ artist: "A", title: "B", duration: 120 })
    expect(reason).toBe("ok")
    expect(lyrics.timestamps).toEqual([
      { startTime: 1, text: "Hello", endTime: 2 },
      { startTime: 2, text: "World", endTime: Infinity },
    ])
  })

  it("returns http-404 when there is no match", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404 })))
    const { lyrics, reason } = await fetchLyricsFromLrclib({ artist: "A", title: "B" })
    expect(lyrics).toBeNull()
    expect(reason).toBe("http-404")
  })

  it("returns no-synced-lyrics for a 200 response without synced lyrics", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ plainLyrics: "text only, no sync" }),
      })),
    )
    const { lyrics, reason } = await fetchLyricsFromLrclib({ artist: "A", title: "B" })
    expect(lyrics).toBeNull()
    expect(reason).toBe("no-synced-lyrics")
  })

  it("retries without the album when an album-qualified lookup misses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        if (url.includes("album_name")) return { ok: false, status: 404 }
        return { ok: true, json: async () => ({ syncedLyrics: "[00:05.00]Retry hit" }) }
      }),
    )
    const { lyrics, reason } = await fetchLyricsFromLrclib({ artist: "A", title: "B", album: "Wrong Album" })
    expect(reason).toBe("ok")
    expect(lyrics.timestamps).toEqual([{ startTime: 5, text: "Retry hit", endTime: Infinity }])
  })

  it("returns http-404 when both the album-qualified and album-less lookups miss", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404 })))
    const { lyrics, reason } = await fetchLyricsFromLrclib({ artist: "A", title: "B", album: "Wrong Album" })
    expect(lyrics).toBeNull()
    expect(reason).toBe("http-404")
  })

  it("returns a network-error reason instead of throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down")
      }),
    )
    const { lyrics, reason } = await fetchLyricsFromLrclib({ artist: "A", title: "B" })
    expect(lyrics).toBeNull()
    expect(reason).toBe("network-error: network down")
  })
})
```

- [ ] **Step 2: Run it**

Run: `npx vitest run src/backend/utils/lrclibClient.test.js`
Expected: PASS, 6 tests, project `backend`.

- [ ] **Step 3: Commit**

```bash
git add src/backend/utils/lrclibClient.test.js
git commit -m "test: port lrclibClient self-check to vitest"
```

---

### Task 6: Remove the superseded `test_*.mjs` scripts

**Files:**
- Delete: `src/backend/utils/test_lastfmClient.mjs`
- Delete: `src/backend/utils/test_lrcParser.mjs`
- Delete: `src/backend/utils/test_lrclibClient.mjs`

**Interfaces:**
- Consumes: Tasks 3-5 must be committed first (their Vitest replacements are the reason these are safe to remove).
- Produces: nothing consumed later; cleans up dead/duplicate code.

- [ ] **Step 1: Delete the three files**

```bash
git rm src/backend/utils/test_lastfmClient.mjs src/backend/utils/test_lrcParser.mjs src/backend/utils/test_lrclibClient.mjs
```

- [ ] **Step 2: Confirm the Vitest suite is still green without them**

Run: `npx vitest run`
Expected: PASS, 16 tests total (4 + 6 + 6 from Tasks 3-5), 0 failures. (Still reports the `frontend` project has no test files — expected until Phase 3.)

- [ ] **Step 3: Commit**

```bash
git commit -m "test: remove superseded test_*.mjs self-check scripts, replaced by vitest specs"
```

---

### Task 7: Add npm test scripts

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: `npm run test`, `npm run test:watch`, `npm run test:coverage`, `npm run test:e2e`, `npm run test:all` — the exact script names the CI workflow (Task 9) and every later phase invoke.

- [ ] **Step 1: Edit the `scripts` block in `package.json`**

Change:
```json
  "scripts": {
    "start": "electron-forge start",
    "package": "electron-forge package",
    "make": "electron-forge make",
    "publish": "electron-forge publish",
    "lint": "echo \"No linting configured\""
  },
```
To:
```json
  "scripts": {
    "start": "electron-forge start",
    "package": "electron-forge package",
    "make": "electron-forge make",
    "publish": "electron-forge publish",
    "lint": "echo \"No linting configured\"",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:all": "npm run test:coverage && npm run test:e2e"
  },
```

- [ ] **Step 2: Verify `test` and `test:coverage` work end-to-end**

Run: `npm run test`
Expected: PASS, 16 tests (same as Task 6's check, now via the npm script).

Run: `npm run test:coverage`
Expected: PASS, same 16 tests, plus a coverage table printed for `src/backend/**` (and `src/frontend/**`/`src/main.js` shown at 0% — expected, no tests target them yet).

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "test: add npm test/test:coverage/test:e2e scripts"
```

---

### Task 8: Playwright config and `e2e/` directory skeleton

**Files:**
- Create: `playwright.config.js`
- Create: `e2e/.gitkeep`

**Interfaces:**
- Produces: `playwright.config.js` with `testDir: "./e2e"`, which Phase 4 adds real specs into. No specs exist yet in this phase — `npm run test:e2e` reporting "no tests found" here is the expected, documented state (see Global Constraints).

- [ ] **Step 1: Create `playwright.config.js`**

```js
import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
})
```

- [ ] **Step 2: Create the `e2e/` directory placeholder**

```bash
mkdir -p e2e
touch e2e/.gitkeep
```

- [ ] **Step 3: Confirm the expected "no tests" state**

Run: `npm run test:e2e`
Expected: Playwright reports `Error: No tests found` and exits non-zero — this is the expected state until Phase 4 adds specs to `e2e/`, not a regression to fix now.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.js e2e/.gitkeep
git commit -m "test: add playwright config and e2e directory skeleton for phase 4"
```

---

### Task 9: GitHub Actions workflow for unit/coverage tests

**Files:**
- Create: `.github/workflows/test.yml`

**Interfaces:**
- Consumes: `npm run test:coverage` (Task 7).
- Produces: a CI check on every push/PR to `main`. Phase 4 extends this same file with an E2E job once `e2e/` has real specs — do not create a second workflow file for that.

- [ ] **Step 1: Create the workflow**

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20.20.2"
      - run: npm ci
      - run: npm run test:coverage
```

- [ ] **Step 2: Validate the workflow actually runs**

Push the branch containing this commit (or open a PR against `main`) and check the "Test" check in the GitHub Actions tab.
Expected: the `unit` job runs `npm ci` then `npm run test:coverage` and finishes green (16 passing tests).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "test: add CI workflow running vitest with coverage on push/PR to main"
```

---

## End-of-phase verification

- [ ] `npm run test` passes locally with 16 tests, 0 failures.
- [ ] `npm run test:coverage` runs and prints a coverage table (no threshold enforced yet).
- [ ] `npm run test:e2e` reports "no tests found" (expected, not a failure).
- [ ] Pushing a branch / opening a PR against `main` triggers the "Test" GitHub Actions check and it passes.
- [ ] `src/backend/utils/test_lastfmClient.mjs`, `test_lrcParser.mjs`, `test_lrclibClient.mjs` no longer exist; their coverage is fully replaced by the three `.test.js` files.

## Next phase

Phase 2 (backend unit tests: refactoring the 12 `register*Handlers` modules, `initDB(dbPath)`, `httpRange.js` extraction, scanner/watcher tests) gets its own plan via a follow-up `superpowers:writing-plans` invocation once this phase is merged — per the phase-by-phase cadence in the approved design (`C:\Users\Ankush\.claude\plans\read-through-my-apps-humble-dahl.md`).
