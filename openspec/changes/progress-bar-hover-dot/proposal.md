## Why

The playback progress bar (`PlayerBar.vue`, `MiniPlayer.vue`, `ImmersiveMode.vue`) shows a floating time tooltip on hover but gives no visual marker of exactly where on the track the cursor is. Users can't precisely see the point they're about to click/drag to, making seeking imprecise, especially on the thin (6px) bar.

## What Changes

- Add a visual dot/handle that tracks the mouse cursor's x-position on the progress bar while hovering, so users can see exactly where a click/drag will seek to.
- Reuse the existing `hoverX` value already computed by the shared `useProgressBar` composable (`src/frontend/utils/playerUtils.js`) — no new tracking logic needed, just a new visual element bound to it.
- Apply consistently across all three progress bar instances that share this composable: `PlayerBar.vue`, `MiniPlayer.vue`, `ImmersiveMode.vue`.
- `MiniPlayer.vue` already has a `.progress-handle` dot, but it's pinned to current playback position (`player.progress`), not the cursor — this is a distinct, separate indicator and is left as-is; the new dot is additive.

## Capabilities

### New Capabilities
- `progress-bar-cursor-indicator`: a visual dot that follows the mouse cursor's horizontal position while hovering the playback progress bar, visible only on hover.

### Modified Capabilities
(none — no existing specs cover progress bar interaction)

## Impact

- `src/frontend/components/PlayerBar.vue`: add cursor-dot element + styles.
- `src/frontend/components/MiniPlayer.vue`: add cursor-dot element + styles (additive to existing playback-position handle).
- `src/frontend/components/ImmersiveMode.vue`: add cursor-dot element + styles.
- No changes to `src/frontend/utils/playerUtils.js` — `hoverX`/`hoverTimeVisible` already provide what's needed.
- No breaking changes; purely additive UI.
