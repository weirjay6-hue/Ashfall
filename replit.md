# ASHFALL

ASHFALL is a single-character open-world RPG with a living browser game and a
separately tested Java/Gradle simulation foundation.

## Run & Operate

- `gradle test` — run Java engine unit tests
- `gradle run --args="--headless --ticks=120 --seed=ashfall-dev"` — run the headless engine
- `pnpm --filter @workspace/ashfall run dev` — run the Ashfall browser game
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/ashfall/` — browser game and playable surface
- `engine/` — Java engine foundation
- `docs/` — permanent design and development handoff memory
- `attached_assets/` — source briefs

## Architecture decisions

- The browser game remains intact while the Java engine is built in verified jobs.
- Simulation uses an explicit seeded RNG and fixed timestep from the first job.
- Architecture choices are measured rather than assuming an ECS or dense arrays.
- The vertical slice is prioritized before large-world simulation.

## Product

The browser game supports character creation, exploration, combat, dungeons,
towns, NPC interactions, inventory, equipment, quests, trading, and save/load.
The Java engine is the foundation for a future persistent living world.

## User preferences

- Save meaningful progress in small Git commits and push to GitHub when authorized.
- Treat the uploaded master bootstrap prompt and `docs/CURRENT_STATE.md` as the
  source of continuity for fresh sessions.

## Gotchas

- Implement one job at a time; update `CURRENT_STATE.md` and `CHANGELOG.md`
  before committing.
- Do not replace the existing browser game with unfinished engine work.
- For GitHub pushes, use the secure `x-access-token` URL rewrite documented in
  `REPLIT_START_HERE.md`; do not use an `Authorization` header or expose token
  values in logs.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
