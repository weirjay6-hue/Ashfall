# Job 002 — World Coordinate System

## ID

002

## Name

World Coordinate System

## Objective

Establish the canonical coordinate model for the engine's world plane and make
chunk-local conversion deterministic, unambiguous, and safe for negative
coordinates.

## Scope

- Unbounded `long` world-cell coordinates.
- `long` chunk coordinates.
- Bounded local cell coordinates.
- Conversion between world and chunk-local addresses.
- Configurable chunk size with a default of 32 cells.
- Engine exposure of the coordinate system.
- Boundary and negative-coordinate unit tests.

## Non-goals

- World generation or terrain.
- Chunk storage or streaming.
- Rendering, camera behavior, or player movement.
- Persistence or serialization.
- Region and area metadata.

## Dependencies

- Job 001 — Engine Foundation.

## Files

- `engine/src/main/java/com/ashfall/engine/Configuration.java`
- `engine/src/main/java/com/ashfall/engine/Engine.java`
- `engine/src/main/java/com/ashfall/engine/Main.java`
- `engine/src/main/java/com/ashfall/engine/WorldCoordinate.java`
- `engine/src/main/java/com/ashfall/engine/ChunkCoordinate.java`
- `engine/src/main/java/com/ashfall/engine/LocalCoordinate.java`
- `engine/src/main/java/com/ashfall/engine/CellAddress.java`
- `engine/src/main/java/com/ashfall/engine/WorldCoordinateSystem.java`
- `engine/src/test/java/com/ashfall/engine/WorldCoordinateSystemTest.java`

## Implementation

The coordinate system uses floor division and floor modulus, so every world
cell maps to exactly one chunk and a local coordinate in the half-open range
`[0, chunkSize)`. Coordinate arithmetic uses exact math and fails explicitly
on overflow instead of silently wrapping.

## Tests

- Positive chunk-boundary location.
- Negative world-cell location.
- Conversion round-trip across a negative chunk.
- Rejection of invalid local coordinates.
- Rejection of non-positive chunk sizes.

## Benchmark

Not applicable for this job. The conversion operations are constant-time and
will be benchmarked with chunk access patterns in a later storage job.

## Success criteria

- `gradle test` passes.
- World coordinates round-trip through chunk/local conversion.
- Negative coordinates remain in valid local ranges.
- The engine exposes one configured coordinate system.
- `--chunk-size=<n>` changes the configured chunk size.

## Status

TESTED