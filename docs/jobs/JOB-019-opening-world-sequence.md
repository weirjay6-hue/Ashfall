# Job 019 — Opening World Sequence

    ## ID

    019

    ## Name

    Opening World Sequence

    ## Objective

    Replace the generic new-character opening with a deterministic, procedural world-introduction sequence. A new character should see a generated world map, choose a starting location, and receive a concise account of the world’s history, important events, elapsed years, and present conditions before play begins.

    This is an additive job and is intentionally separate from Job 006 — Chunk Streaming.

    ## Scope

    - Generate a playable world overview from a seed rather than authoring a 500 x 500 collection of static files.
    - Present a clear map-based starting-location choice for a new character.
    - Generate chronological world context: years, major events, factions or settlements relevant to the selected region, and the current situation.
    - Persist the world seed, selected starting location, generated chronology, and opening state so a save/load cycle reproduces the same beginning.
    - Replace the default opening dialogue with the generated world-introduction flow.
    - Keep the presentation usable on an iPhone-sized browser viewport.

    ## Non-goals

    - Chunk streaming, eviction, or storage policy; those remain Job 006.
    - Generating 250,000 individually authored cells or files.
    - Building the complete economy, faction simulation, NPC life simulation, combat system, or full quest system.
    - Rewriting the existing browser game or engine architecture outside the smallest interfaces required by this job.
    - Native mobile binaries.

    ## Dependencies

    - Job 005 — Basic World Generator.
    - Job 006 — Chunk Streaming, when the selected location needs streamed world data.
    - Job 007 — Minimal Player, for binding the selected location to the new character.
    - Existing world-map and save/load boundaries documented in the repository.

    ## Files

    Implementation files must be identified from the current repository state immediately before implementation. This job record is the source of the behavior contract; it is not permission to scan or rewrite unrelated source.

    ## Implementation

    PLANNED. The implementation must use deterministic seeded generation and data-driven records. The generated opening should be reproducible, concise enough to read, and explicit about what is generated versus what is authored.

    ## Tests

    - The same seed produces the same map summary, chronology, current year, and available starting locations.
    - Different seeds can produce different valid world introductions.
    - Every selectable location is within the generated world bounds and maps to a valid starting state.
    - Generated years and events are chronological and internally consistent.
    - The selected location and generated opening survive save/load without changing.
    - The generic opening dialogue is no longer the default path for a new character.
    - The implementation does not require a static file for every world cell.
    - The opening remains readable and usable on an iPhone-sized viewport.

    ## Benchmark

    Measure generation and opening-state construction time for representative seeds. Record memory behavior and ensure the opening does not eagerly materialize the complete world.

    ## Success criteria

    - A new character can review the generated world context, choose a starting location from the map, and enter the game from that location.
    - The beginning is deterministic, saveable, and data-driven.
    - The opening communicates history and current conditions rather than showing placeholder dialogue.
    - Existing systems remain intact outside the bounded interfaces needed for the new flow.
    - Tests, documentation, commit, and push are completed before marking the job implemented.

    ## Status

    PLANNED
    