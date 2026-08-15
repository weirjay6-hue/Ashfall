# ASHFALL Next Task

    ## Next bounded task

    **Job 006 — Chunk Streaming**

    Read docs/jobs/JOB-006-chunk-streaming.md before inspecting implementation files.

    ## Objective

    Load and unload only the chunks required by a bounded visibility/request
    window while preserving the existing coordinate, storage, and generator
    contracts.

    ## Required non-goals

    - Do not implement player movement, rendering, camera, combat, or inventory.
    - Do not implement the opening map/lore flow.
    - Do not rewrite the existing browser game.
    - Do not build the complete simulation, economy, or NPC life system.

    ## Session rule

    Implement only Job 006, then test, benchmark where relevant, update the
    control files, commit, push, and stop. Job 019 remains a separate later
    scope.
    

## Current implementation status

    Job 005 is benchmarked and verified. Job 006 is now the next bounded task.
