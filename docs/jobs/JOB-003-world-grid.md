# Job 003 — World Grid

## ID

003

## Name

World Grid

## Objective

Represent a small, finite world surface that can be addressed through the
canonical coordinate system without introducing terrain generation, persistence,
or streaming.

## Scope

- Finite world-grid bounds.
- Configurable positive width and height.
- Exclusive maximum boundary.
- Stable row-major cell indexing.
- Engine exposure of the configured grid.
- Command-line width and height configuration.
- Bounds and index unit tests.

## Non-goals

- Terrain or biome data.
- Chunk storage or persistence.
- World generation.
- Chunk streaming.
- Rendering, camera behavior, or player movement.
- Region and area metadata.

## Dependencies

- Job 002 — World Coordinate System.

## Files

- `engine/src/main/java/com/ashfall/engine/Configuration.java`
- `engine/src/main/java/com/ashfall/engine/Engine.java`
- `engine/src/main/java/com/ashfall/engine/Main.java`
- `engine/src/main/java/com/ashfall/engine/WorldGrid.java`
- `engine/src/test/java/com/ashfall/engine/EngineTest.java`
- `engine/src/test/java/com/ashfall/engine/WorldGridTest.java`

## Implementation

`WorldGrid` stores a finite rectangle whose origin is inclusive and whose
maximum coordinate is exclusive. Coordinates map to row-major integer indexes,
which gives later storage jobs a stable layout without deciding what a cell
contains. The engine defaults to a 128 by 128 grid centered around the world
origin and accepts `--grid-width=<n>` and `--grid-height=<n>`.

## Tests

- Inclusive origin and exclusive maximum boundary.
- Stable row-major coordinate indexing.
- Index-to-coordinate round trips for every cell.
- Rejection of out-of-bounds coordinates and indexes.
- Rejection of invalid dimensions.

## Benchmark

Not applicable for this job. Index conversion is constant-time; storage access
patterns will be measured after chunk storage exists.

## Success criteria

- `gradle test` passes.
- The engine exposes a configured finite world grid.
- Grid bounds are explicit and safe.
- Every valid coordinate has one stable index and every valid index maps back.
- The existing browser game remains unchanged.

## Status

TESTED