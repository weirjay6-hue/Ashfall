# Current State

## Current phase

Phase 1 — Engine Foundation.

## Current job

Job 001 — Engine Foundation is implemented and tested. The next job is Job
002 — World Coordinate System.

## Completed

- Phase 0 documentation architecture.
- Existing browser RPG preserved at `artifacts/ashfall`.
- Archive branch created before engine work.
- Job 001 Java/Gradle foundation.

## Active systems

- Browser game: world map, wilderness, towns, combat, dungeons, inventory,
  shops, quests, saves, and world ticks.
- Engine: configuration, lifecycle, fixed timestep, deterministic RNG,
  logging, headless execution, and performance counters.

## Known limitations

- Java engine has no world, player, rendering, or persistence yet.
- Gradle build uses Java 17-compatible source settings.
- Browser game and Java engine are intentionally separate until the engine
  reaches a useful vertical-slice boundary.

## Test status

- `gradle test`: passing.
- `gradle run --args="--headless --ticks=120 --seed=ashfall-dev"`: passing.
- Browser game checks remain available through the existing pnpm scripts.

## Next job

Job 002 — World Coordinate System.