# ASHFALL — Start Here For A Fresh Replit Session

    This is the low-cost entrypoint for continuing ASHFALL from a new Replit account or chat.

    ## Mission

    ASHFALL is a single-character open-world RPG whose world changes around the player. Continue it incrementally from the repository state. The repository is the source of truth; the agent’s conversation memory is not.

    ## Hard resource boundary

    Before doing any implementation work:

    1. Do not mount, clone, import, or copy the full repository into the working environment.
    2. Read only these small control files through the repository view or GitHub contents API:
     - README.md
     - REPLIT_START_HERE.md
     - PROJECT_STATE.md
     - NEXT_TASK.md
     - SYSTEM_MAP.md
     - TEST_STATUS.md
     - docs/JOB_PROTOCOL.md
     - the single active job record named by NEXT_TASK.md
    3. Do not open or scan artifacts/ashfall, engine, lib, attached_assets, or large asset directories during orientation.
    4. Do not run pnpm install, Gradle builds, asset generation, repository-wide grep, or full test suites until the active job identifies the relevant subsystem and the session has a bounded plan.
    5. Before touching source, state the current phase, active job, files that will be inspected, files that will be changed, and explicit non-goals.

    If GitHub access is unavailable, ask the user to connect GitHub or provide access through Replit’s secure secrets flow. Never request or accept an access token in ordinary chat.

    ## Current pointer

    - Current phase: Phase 1 — Engine Foundation.
    - Completed implementation jobs: 001 through 004.
    - Next roadmap job: 005 — Basic World Generator.
    - Existing roadmap Job 006: Chunk Streaming.
    - Separate planned Job 019: Opening World Sequence, covering generated history/lore, map-based starting-location selection, and deterministic new-character entry.
    - Do not replace Job 006 with Job 019.

    ## Fresh-session sequence

    1. Read the control files listed above.
    2. Read the active job record only.
    3. Confirm the repository branch and latest documented status without downloading source.
    4. Define one bounded implementation phase.
    5. Inspect only the files named by that phase.
    6. Implement the smallest change that satisfies the active job.
    7. Run the job’s tests and relevant benchmark.
    8. Update PROJECT_STATE.md, NEXT_TASK.md, TEST_STATUS.md, the job record, and the appropriate changelog or development log.
    9. Review the diff, commit with a meaningful message, and push when authorized.
    10. Stop. Do not start the next job in the same session.

    ## Copy/paste resume prompt

    Continue ASHFALL from this repository. Do not mount, clone, import, or broadly scan the game source. Read REPLIT_START_HERE.md, PROJECT_STATE.md, NEXT_TASK.md, SYSTEM_MAP.md, TEST_STATUS.md, docs/JOB_PROTOCOL.md, and only the active job record. Work on one bounded job only, inspect the smallest relevant file set, preserve working systems, test the change, update the control files, commit, push, and stop.

    ## Procedural-world rule

    Represent the large world through a seed, region generation, terrain, biomes, settlements, NPC spawning, factions, economy, and events. Do not author or generate one static file for every world cell or every simulated entity. Generate only the data required by the active job and visible simulation window.

    ## Product constraints

    - Keep the browser game usable on iPhone-sized viewports.
    - Prefer deterministic, data-driven rules and reproducible saves.
    - Do not introduce native mobile binaries in this workflow.
    - Do not replace working browser or engine systems without an explicit job requirement.
    - Fail explicitly instead of hiding missing data behind silent fallbacks.
    