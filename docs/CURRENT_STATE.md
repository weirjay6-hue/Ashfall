# Current State

## Current phase

Phase 1 — Engine Foundation.

## Current job

Job 003 — World Grid is implemented and tested. The next job is Job 004 —
Chunk Storage.

## Completed

- Phase 0 documentation architecture.
- Existing browser RPG preserved at `artifacts/ashfall`.
- Archive branch created before engine work.
- Job 001 Java/Gradle foundation.
- Job 002 world coordinate system.
- Job 003 world grid.

## Active systems

- Browser game: world map, wilderness, towns, combat, dungeons, inventory,
  shops, quests, saves, and world ticks.
- Engine: configuration, lifecycle, fixed timestep, deterministic RNG,
  logging, headless execution, and performance counters.

## Known limitations

- Java engine has coordinates and a finite world grid but no chunk storage,
  player, rendering, or persistence yet.
- Gradle build uses Java 17-compatible source settings.
- Browser game and Java engine are intentionally separate until the engine
  reaches a useful vertical-slice boundary.

## Test status

- `gradle test`: passing.
- `gradle run --args="--headless --ticks=120 --seed=ashfall-dev"`: passing.
- `gradle run --args="--headless --ticks=120 --seed=ashfall-dev --chunk-size=32"`:
  passing.
- `gradle run --args="--headless --ticks=120 --seed=ashfall-dev --chunk-size=32 --grid-width=128 --grid-height=128"`:
  passing.
- Browser game checks remain available through the existing pnpm scripts.

## GitHub push

Pushed successfully to `origin/main`. The pre-bootstrap local state is also
preserved on `origin/archive/pre-bootstrap-20260815`.

## Next job

Job 004 — Chunk Storage.