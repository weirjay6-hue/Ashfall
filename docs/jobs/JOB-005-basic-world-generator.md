# Job 005 — Basic World Generator

    ## ID

    005

    ## Name

    Basic World Generator

    ## Objective

    Generate valid world and chunk data deterministically from a seed, providing the procedural foundation for streaming and later gameplay without creating a static file for every world cell.

    ## Scope

    - Seed-driven terrain or cell generation within the existing finite world grid.
    - Deterministic generation for repeated coordinates and seeds.
    - Integration with the existing coordinate, grid, and chunk-storage contracts.
    - Explicit generation boundaries and invalid-input behavior.
    - Small summaries or metadata useful to later streaming and gameplay jobs.

    ## Non-goals

    - Chunk streaming, eviction, or loading policy; that is Job 006.
    - Player, camera, rendering, combat, inventory, or opening dialogue.
    - Complete biome, settlement, faction, economy, or NPC simulation.
    - Eager generation of the entire 500 x 500 world.
    - Rewriting the existing browser game.

    ## Dependencies

    - Job 002 — World Coordinate System.
    - Job 003 — World Grid.
    - Job 004 — Chunk Storage.

    ## Files

    - `engine/src/main/java/com/ashfall/engine/WorldGenerator.java`
    - `engine/src/main/java/com/ashfall/engine/Engine.java`
    - `engine/src/main/java/com/ashfall/engine/Chunk.java`
    - `engine/src/main/java/com/ashfall/engine/ChunkStore.java`
    - `engine/src/main/java/com/ashfall/engine/WorldGrid.java`
    - `engine/src/main/java/com/ashfall/engine/WorldCoordinateSystem.java`
    - `engine/src/test/java/com/ashfall/engine/WorldGeneratorTest.java`

    ## Implementation

    `WorldGenerator` derives each terrain value from the world seed and absolute
    world coordinate using a stable 64-bit mixing function. It generates chunks
    on demand, validates the finite grid before allocating a chunk, and writes
    terrain values through the existing `Chunk` contract. The engine exposes
    `generateChunk` to generate and store a valid chunk without materializing the
    complete world.

    ## Tests

    `gradle test --no-daemon` — PASS. The suite covers deterministic generation,
    seed variation, terrain vocabulary, finite-grid bounds, and engine storage
    integration. The implementation generates one requested chunk at a time, so
    it does not materialize the complete world.

    ## Benchmark

    A temporary Java harness generated 1,024 chunks of 32 × 32 cells after a
    128-chunk warm-up using a 1,024 × 1,024-cell finite grid. With a 64 MiB
    initial and 256 MiB maximum heap, generation took 79.105 ms, or about
    12,944.8 chunks/second, with a measured heap delta of 31,578,736 bytes.

    ## Success criteria

    - The engine can produce reproducible valid world data from a seed. PASS.
    - Later streaming work can request generated chunks without changing the coordinate or storage contracts. PASS.
    - Tests and documentation pass, followed by a reviewed commit and push. Tests and documentation PASS; commit/push pending final GitHub authorization.

    ## Status

    BENCHMARKED
    

## Verification status

The full engine test suite, headless run, and representative generation
benchmark pass in the Java-enabled environment. The GitHub push remains pending
because the secure GitHub integration was declined and the available token
credentials have not authenticated successfully.
