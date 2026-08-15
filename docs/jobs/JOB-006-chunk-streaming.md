# Job 006 — Chunk Streaming

    ## ID

    006

    ## Name

    Chunk Streaming

    ## Objective

    Load and unload a bounded set of generated chunks around an active interest point, keeping the world simulation memory bounded while preserving deterministic chunk identity and existing storage contracts.

    ## Scope

    - Explicit streaming radius or window around an active world coordinate.
    - Deterministic load ordering and clear unload/eviction behavior.
    - Integration with Basic World Generator and Chunk Storage.
    - Repeated movement or interest-point changes without duplicate or corrupted chunks.
    - Headless operation and measurable memory/runtime behavior.

    ## Non-goals

    - New-character map selection or generated opening history; that is Job 019.
    - Player movement, rendering, camera, combat, inventory, or persistence.
    - Loading the complete world at startup.
    - Rewriting the existing browser game.

    ## Dependencies

    - Job 004 — Chunk Storage.
    - Job 005 — Basic World Generator.

    ## Files

    Identify implementation files from the smallest relevant engine subsystem immediately before implementation. Do not scan unrelated source.

    ## Implementation

    PLANNED. Use a bounded, explicit policy. The active window must be reproducible from the same world configuration, seed, interest point, and streaming settings.

    ## Tests

    - Required chunks load for an interest point.
    - Chunks outside the active window unload according to the documented policy.
    - Repeated requests do not duplicate chunks or change generated values.
    - Boundary coordinates and invalid settings fail explicitly.
    - Streaming works with the existing sparse ChunkStore.
    - Memory remains bounded for representative movement across the world.

    ## Benchmark

    Measure load/unload time, peak loaded chunk count, and memory behavior for representative movement and radius settings.

    ## Success criteria

    - The engine can move an active interest point through the world without loading everything.
    - Generated chunk contents remain deterministic.
    - Tests, benchmark, documentation, reviewed commit, and push are complete before marking the job done.

    ## Status

    PLANNED
    