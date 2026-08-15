# ASHFALL Next Task

    ## Next bounded task

    **Job 005 — Basic World Generator**

    Read docs/jobs/JOB-005-basic-world-generator.md before inspecting implementation files.

    ## Objective

    Create a deterministic, seed-driven generator that can populate valid world/chunk data for later streaming and gameplay work without materializing the complete world or creating one file per cell.

    ## Required non-goals

    - Do not implement chunk streaming; that is Job 006.
    - Do not implement player movement, combat, inventory, or the opening map/lore flow.
    - Do not rewrite the existing browser game.
    - Do not build the complete simulation, economy, or NPC life system.

    ## Session rule

    Implement only Job 005, then test, benchmark where relevant, update the control files, commit, push, and stop. If the user explicitly chooses Job 006 instead, switch only after reading docs/jobs/JOB-006-chunk-streaming.md and record the decision in the state files. Job 019 remains a separate later scope.
    