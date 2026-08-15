# Performance Bible

The goal is an architecture capable of scaling, not premature micro-
optimization. The loop is profile → find hotspot → understand → change →
benchmark → keep or revert.

Track tick duration, chunk generation/loading, entity processing, pathfinding,
save/load, simulation time, and memory when those systems exist. Do not claim
performance numbers without a measurement.