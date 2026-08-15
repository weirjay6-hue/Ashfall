# Job 001 — Engine Foundation

## Objective

Create the smallest runnable Java/Gradle engine shell with deterministic
timing, explicit randomness, lifecycle control, logging, headless execution,
performance counters, and basic tests.

## Scope

- Java and Gradle build.
- Main entry point and command-line configuration.
- Fixed timestep loop.
- Explicit seeded RNG.
- Lifecycle logging.
- Headless tick execution.
- Basic unit tests.

## Non-goals

No gameplay, world, entities, rendering, persistence, networking, or external
gameplay libraries.

## Files

- `build.gradle`
- `settings.gradle`
- `engine/src/main/java/com/ashfall/engine/`
- `engine/src/test/java/com/ashfall/engine/`

## Success criteria

- `gradle test` passes.
- Headless mode accepts a seed and tick count.
- The same seed produces the same RNG sequence.
- Fixed timestep processes only complete simulation ticks.
- Lifecycle and performance counters are observable.

## Status

TESTED