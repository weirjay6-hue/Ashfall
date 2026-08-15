# Engine Bible

## Layers

- Core: timing, configuration, logging, RNG, events, lifecycle.
- World: coordinates, regions, areas, chunks, terrain, generation, streaming.
- Simulation: time, entities, AI, needs, schedules, economy, factions.
- Gameplay: player, movement, combat, inventory, equipment, skills, quests.
- Rendering: camera, terrain, entities, visibility, lighting, UI.
- Persistence: versioned player, world, entity, and event state.
- Tools: debug panels, inspection, profiling, and simulation controls.

## Rules

Simulation time is separate from render time and uses a fixed timestep.
Persistent entities have stable IDs. Randomness is explicit and seeded.
Architecture is chosen from measured access patterns rather than ideology:
dense data, sparse data, objects, events, and on-demand generation are all
valid where justified.