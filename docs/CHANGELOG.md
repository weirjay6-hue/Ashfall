# Changelog

## 2026-08-15

- Established the ASHFALL Phase 0 documentation architecture.
- Preserved the existing browser game and created an archive branch before
  engine work.
- Implemented and tested Job 001 Engine Foundation with Java and Gradle:
  configuration, lifecycle, fixed timestep, explicit seeded RNG, logging,
  headless mode, and performance counters.
- Pushed the milestone to GitHub `main` and preserved the pre-bootstrap state
  on `archive/pre-bootstrap-20260815`.
- Implemented and tested Job 002 World Coordinate System with canonical world,
  chunk, local, and cell-address types, negative-coordinate-safe conversion,
  and configurable chunk size.