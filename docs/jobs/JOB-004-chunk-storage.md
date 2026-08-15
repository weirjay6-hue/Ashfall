# Job 004 — Chunk Storage

## ID

004

## Name

Chunk Storage

## Objective

Provide deterministic sparse in-memory storage for fixed-size chunks inside the
finite world grid, with cell-value access ready for later generation work.

## Scope

- Fixed-size chunk cell buffers.
- Sparse coordinate-keyed chunk store.
- Matching chunk-size validation.
- Full-footprint world-grid bounds validation.
- Deterministic loaded-coordinate listing.
- Insert, replace, find, remove, and clear operations.
- Engine exposure of the chunk store.

## Non-goals

- Terrain or biome definitions.
- World generation.
- Disk persistence or serialization.
- Chunk streaming or eviction policy.
- Rendering, camera behavior, or player movement.
- Region and area metadata.

## Dependencies

- Job 002 — World Coordinate System.
- Job 003 — World Grid.

## Files

- `engine/src/main/java/com/ashfall/engine/WorldGrid.java`
- `engine/src/main/java/com/ashfall/engine/Chunk.java`
- `engine/src/main/java/com/ashfall/engine/ChunkStore.java`
- `engine/src/main/java/com/ashfall/engine/Engine.java`
- `engine/src/test/java/com/ashfall/engine/WorldGridTest.java`
- `engine/src/test/java/com/ashfall/engine/ChunkStoreTest.java`
- `engine/src/test/java/com/ashfall/engine/EngineTest.java`

## Implementation

Each chunk owns a row-major integer cell buffer initialized to zero. A
`ChunkStore` keeps only loaded chunks in insertion-ordered sparse storage keyed
by `ChunkCoordinate`. Chunks must match the configured chunk size and their
entire footprint must fit within the finite `WorldGrid`; partial edge chunks
are rejected rather than silently truncating the world.

## Tests

- Chunk creation, lookup, and cell-value persistence.
- Deterministic insertion-order listing.
- Explicit replacement and removal.
- Mismatched-size and out-of-bounds rejection.
- Invalid local-cell rejection.
- World-grid full-footprint chunk bounds.
- Empty engine chunk store.

## Benchmark

Not applicable for this job. Access is constant-time for the current in-memory
map and array layout; streaming and larger-world measurements come later.

## Success criteria

- `gradle test` passes.
- The engine exposes a usable empty chunk store.
- Valid chunks can be created, addressed, replaced, and removed.
- Invalid chunk sizes and locations fail explicitly.
- The existing browser game remains unchanged.

## Status

TESTED