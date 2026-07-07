## Context

`useProgressBar(player)` in `src/frontend/utils/playerUtils.js` already computes `hoverX` (cursor x-offset in px, relative to the bar's left edge) and `hoverTimeVisible` (boolean) on `@mousemove`/`@mouseleave` of the `.progress-bar` element. This currently only drives a floating time-tooltip (`.hover-time`). `MiniPlayer.vue` separately has a `.progress-handle` div positioned at `player.progress * 100%` (current playback position), shown on `.progress-bar:hover`, unrelated to cursor position.

## Goals / Non-Goals

**Goals:**
- Add a small circular dot on the progress bar track that tracks the cursor's horizontal position while hovering, giving a precise visual target for click/drag seeking.
- Consistent behavior/markup across `PlayerBar.vue`, `MiniPlayer.vue`, `ImmersiveMode.vue`.

**Non-Goals:**
- Not changing seek/drag mechanics (still click-to-seek via existing `seek()`; no new drag-and-hold scrubbing behavior).
- Not touching `MiniPlayer.vue`'s existing playback-position handle — that stays as a separate, distinct element.
- Not adding new composable state — reuse `hoverX`/`hoverTimeVisible` as-is.

## Decisions

- **New `.progress-cursor-dot` element, positioned via inline `style="left: hoverX + 'px'"`, `v-if="hoverTimeVisible"`.** Mirrors the existing `.hover-time` tooltip's pattern exactly (same `v-if`, same `left: hoverX + 'px'` binding) — no new reactive state, minimal diff. Alternative considered: CSS-only `::before` pseudo-element following a custom property set via JS on mousemove — rejected, adds an imperative DOM write path for something Vue's reactivity already handles declaratively via existing `hoverX`.
- **Circular dot styled inline on the bar (not a separate floating tooltip).** Matches the visual language of `MiniPlayer.vue`'s existing `.progress-handle` (14px circle, `top: 50%`, `transform: translate(-50%, -50%)`) for consistency, just driven by `hoverX` instead of `player.progress`.

## Risks / Trade-offs

- [Two dots visible at once on `MiniPlayer.vue` when hovering (existing playback-position handle + new cursor dot) could look cluttered] → Mitigation: differentiate visually (e.g., smaller/dimmer cursor dot, or only show cursor dot outside a small radius of the playback-position handle) — left as an implementation detail to eyeball during 1.x tasks, not a blocking design decision.
- [Dot rendering on top of `.progress-fill` at low z-index could get visually clipped] → Mitigation: explicit `z-index` above `.progress-fill`, matching how `.hover-time` already stacks correctly today.
