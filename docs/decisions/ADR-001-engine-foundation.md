# ADR-001: Add a Java Engine Alongside the Browser Game

## Decision

Build the long-term simulation engine as a minimal Java/Gradle module at the
repository root while keeping the existing browser game at
`artifacts/ashfall`.

## Reason

The master design calls for a deterministic, headless-capable engine and the
current repository already contains a working browser RPG surface. Keeping
the two tracks separate allows the playable game to remain available while the
engine is built and tested incrementally.

## Alternatives

- Replace the browser game immediately with an unfinished engine.
- Rebuild the engine in JavaScript only.
- Add world simulation before establishing timing and deterministic contracts.

## Consequences

The repository temporarily has two runtime tracks. They must be documented
and integrated only when a later job provides a concrete, tested boundary.