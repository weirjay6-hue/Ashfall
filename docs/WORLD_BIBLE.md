# World Bible

The world hierarchy is WORLD → REGIONS → AREAS → CHUNKS → CELLS. Dimensions
remain configurable; early development uses small worlds.

Chunks exist for streaming, memory management, generation, persistence,
simulation LOD, rendering, and spatial queries. Nearby chunks can be detailed
while distant chunks remain compact simulation state.

Generation should eventually follow causal layers: seed → elevation → climate
→ biomes → water → resources → roads → locations → settlements → population.
Do not generate the final world during early development.