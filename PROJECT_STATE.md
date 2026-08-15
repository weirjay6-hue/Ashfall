# ASHFALL Project State

    ## Snapshot

    - Phase: Phase 1 — Engine Foundation.
    - Last tested implementation: Job 004 — Chunk Storage.
    - Current orientation status: documentation-only continuation controls are in place; no game source is being changed by this control update.
    - Next roadmap job: Job 005 — Basic World Generator.
    - Existing Job 006: Chunk Streaming.
    - Separate planned Job 019: Opening World Sequence.

    ## Completed

    - Phase 0 documentation architecture.
    - Existing browser RPG preserved at artifacts/ashfall.
    - Archive branch created before engine work.
    - Job 001 Engine Foundation.
    - Job 002 World Coordinate System.
    - Job 003 World Grid.
    - Job 004 Chunk Storage.

    ## Active systems

    - Browser game: world map, wilderness, towns, combat, dungeons, inventory, shops, quests, saves, and world ticks.
    - Engine: configuration, lifecycle, fixed timestep, deterministic RNG, logging, headless execution, performance counters, finite world grid, and sparse chunk storage.
    - Permanent handoff: root control files plus docs/.

    ## Known limitations

    - The engine has no completed world generator, streaming policy, player, rendering, or engine persistence yet.
    - Browser game and Java engine remain separate until a useful vertical-slice boundary is reached.
    - Job 005 and Job 006 need explicit job records before implementation begins; those records are now present and planned.
    - The generated opening/map/lore requirement is intentionally separate as Job 019.

    ## Non-negotiable boundaries

    - Do not mount or broadly scan the full repository during orientation.
    - Do not rewrite the browser game while doing an engine job.
    - Do not eagerly materialize a 500 x 500 world or create one static file per cell.
    - Do not mark a job complete without tests, documentation, a reviewed diff, and a commit.
    