# ASHFALL System Map

    This map is intentionally high-level so a fresh session can choose a narrow inspection boundary.

    ## Product surfaces

    - artifacts/ashfall/ — existing browser RPG and playable surface. Preserve unless the active job explicitly targets it.
    - engine/ — Java/Gradle simulation foundation. Current engine work is headless and incremental.

    ## Shared project memory

    - README.md — project overview and run commands.
    - REPLIT_START_HERE.md — fresh-session gate and resume prompt.
    - PROJECT_STATE.md — concise current snapshot.
    - NEXT_TASK.md — one next bounded job.
    - SYSTEM_MAP.md — this map.
    - TEST_STATUS.md — last known checks.
    - docs/ — design bibles, workflow, roadmap, decisions, and job records.

    ## Job boundaries

    - World coordinate/grid/chunk contracts: engine foundation jobs 002–004.
    - Basic deterministic generation: Job 005.
    - Loading/unloading visible or needed chunks: Job 006.
    - Minimal player and movement: Jobs 007–008.
    - Early exploration/combat/loot/inventory: Jobs 010–015.
    - Opening generated history, map selection, and new-character entry: Job 019.

    ## Inspection rule

    Start from the active job record. Inspect only the smallest subsystem and its tests. Never use this map as a reason to open every listed directory.
    