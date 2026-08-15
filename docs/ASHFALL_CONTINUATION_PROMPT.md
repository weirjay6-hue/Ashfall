# ASHFALL Continuation Prompt

    ## Mission

    Continue ASHFALL from the repository’s documented state. Build one bounded job at a time. Preserve working systems, avoid broad rediscovery, and leave the repository recoverable at the end of every session.

    ASHFALL is a single-character open-world RPG whose world changes around the player. The world must be represented procedurally and data-first so a large world can be simulated without creating a static file for every cell, NPC, item, or event.

    ## First actions in every fresh session

    1. Read README.md.
    2. Read docs/ASHFALL_MASTER_DESIGN.md, docs/CURRENT_STATE.md, docs/DEVELOPMENT_ROADMAP.md, and docs/JOB_PROTOCOL.md.
    3. Read only the active job record and the smallest relevant set of files. Do not mount, clone, or broadly scan the game source merely to rediscover context.
    4. Check the repository status, current branch, recent history, build status, and tests.
    5. Save or confirm the current documented state before beginning implementation.
    6. Implement exactly one bounded job.

    ## Current repository boundary

    The repository currently records Job 004 — Chunk Storage as tested. The roadmap’s existing Job 006 is Chunk Streaming and must remain its own job. The new opening/map/lore requirement is recorded separately as Job 019 — Opening World Sequence. Do not substitute one for the other.

    ## Job 019 behavior contract

    When Job 019 is eventually selected for implementation, a new character must receive a deterministic generated world introduction, view a generated map, choose a starting location, and enter play with the generated seed, chronology, and location persisted. The opening should describe relevant years, events, settlements or factions, and present conditions. It must replace generic placeholder opening dialogue without requiring a manually authored file for every world cell.

    ## Development rules

    - Do not attempt to build the entire game in one session.
    - Do not redesign or rebuild working systems unless the active job explicitly requires it.
    - Treat docs/CURRENT_STATE.md and the active job record as the source of truth.
    - Prefer deterministic seeded generation and explicit data contracts.
    - Keep the browser surface usable on iPhone-sized screens; do not introduce native mobile binaries in this workflow.
    - Fail explicitly when required data is unavailable; do not hide failures behind silent fallbacks.
    - Add regression tests for failures and edge cases.
    - Avoid eagerly generating the entire world.

    ## Completion sequence

    Specification → implementation → unit tests → integration tests → benchmark where relevant → documentation → diff review → meaningful commit → push when authorized. Update the current state, job status, test status, and changelog before ending the session. If implementation is blocked, document the exact blocker and leave no misleading success status.

    ## Recovery

    A fresh session should resume from the repository documents, not from memory. If a session fails, inspect the last documented status and commit, isolate the smallest incomplete job, and do not restart by rewriting unrelated systems.
    