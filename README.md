# ASHFALL

ASHFALL is a single-character open-world RPG where the world continues to
change around the player. The current browser game is the playable surface;
the Java/Gradle engine foundation is being built underneath it in small,
verified jobs.

## Current state

- Phase 0 documentation is established.
- Job 001, Engine Foundation, is implemented and tested.
- The existing browser game remains at `artifacts/ashfall`.
- The engine foundation lives under `engine/` and currently runs headlessly.

## Run the browser game

```bash
pnpm install
pnpm --filter @workspace/ashfall run dev
```

## Run the engine

```bash
gradle test
gradle run --args="--headless --ticks=120 --seed=ashfall-dev"
```

## Development protocol

Read `docs/CURRENT_STATE.md` first, then the current job record in
`docs/jobs/`. Implement one job at a time, test it, document it, commit it,
and push it to GitHub when authorization is available.

## Repository map

- `artifacts/ashfall/` — current browser RPG.
- `engine/` — Java/Gradle simulation foundation.
- `docs/` — permanent design, architecture, workflow, and handoff memory.
- `attached_assets/` — source briefs supplied during development.