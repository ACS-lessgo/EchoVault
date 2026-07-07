## 1. PlayerBar.vue

- [x] 1.1 Add `.progress-cursor-dot` div bound to `hoverX`/`hoverTimeVisible` (same pattern as existing `.hover-time`)
- [x] 1.2 Add matching CSS (small circle, `z-index` above `.progress-fill`)

## 2. MiniPlayer.vue

- [x] 2.1 Add `.progress-cursor-dot` div bound to `hoverX`/`hoverTimeVisible`, distinct from the existing playback-position `.progress-handle`
- [x] 2.2 Add matching CSS, visually differentiated from `.progress-handle` so both can be visible without confusion

## 3. ImmersiveMode.vue

- [x] 3.1 Add `.progress-cursor-dot` div bound to `hoverX`/`hoverTimeVisible`
- [x] 3.2 Add matching CSS

## 4. Verify

- [x] 4.1 Run app, hover progress bar in main player bar — dot tracks cursor, hides on mouse leave
- [x] 4.2 Same check in mini player — new cursor dot and existing playback-position handle both render correctly, not confusing
- [x] 4.3 Same check in immersive mode
- [x] 4.4 Click-to-seek still works unchanged in all three
