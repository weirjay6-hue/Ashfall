# ASHFALL Project State

## Current state

- Phase 1 — Engine Foundation.
- Jobs 001–004 are completed and tested.
- Job 005 — Basic World Generator is the next roadmap job.
- Job 006 — Chunk Streaming remains a separate job.
- Job 019 — Opening World Sequence is a separate planned job.

## Existing systems

- Browser RPG: map, wilderness, towns, combat, dungeons, inventory, shops,
  quests, saves, and world ticks.
- Java/Gradle engine: configuration, lifecycle, fixed timestep, deterministic
  RNG, logging, headless execution, performance counters, world grid, and
  sparse chunk storage.

## Known limitations

- The engine still needs world generation, streaming, player behavior,
  rendering, and engine persistence.
- The browser game and engine remain separate until a useful vertical slice.
- The large world must remain procedural and data-driven.

## Boundaries

- Do not rewrite working systems without an active job requiring it.
- Do not eagerly generate the complete 500 x 500 world.
- Do not create one static file per world cell or simulated entity.
- Do not mark a job complete without tests, documentation, a reviewed diff,
  and a commit.