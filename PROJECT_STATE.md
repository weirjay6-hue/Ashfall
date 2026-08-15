# ASHFALL Project State

    ## Snapshot

    - Phase: Phase 1 — Engine Foundation.
    - Last tested implementation: Job 005 — Basic World Generator.
    - Current job: Job 005 — Basic World Generator (BENCHMARKED).
- Current orientation status: implementation is limited to the engine world-generation subsystem; the browser game remains untouched.
    - Next roadmap job: Job 006 — Chunk Streaming.
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
    - Job 005 Basic World Generator.

    ## Active systems

    - Browser game: world map, wilderness, towns, combat, dungeons, inventory, shops, quests, saves, and world ticks.
    - Engine: configuration, lifecycle, fixed timestep, deterministic RNG, logging, headless execution, performance counters, finite world grid, sparse chunk storage, and deterministic on-demand world generation.
    - Permanent handoff: root control files plus docs/.

    ## Known limitations

    - The engine has no completed streaming policy, player, rendering, or engine persistence yet.
    - Browser game and Java engine remain separate until a useful vertical-slice boundary is reached.
    - Job 006 remains the next bounded engine job.
    - The generated opening/map/lore requirement is intentionally separate as Job 019.

    ## Non-negotiable boundaries

    - Do not mount or broadly scan the full repository during orientation.
    - Do not rewrite the browser game while doing an engine job.
    - Do not eagerly materialize a 500 x 500 world or create one static file per cell.
    - Do not mark a job complete without tests, documentation, a reviewed diff, and a commit.
    

    ## Verification

    Job 005 passed the full engine test suite, the headless run, and a
    representative generation benchmark. The browser game remains untouched.
