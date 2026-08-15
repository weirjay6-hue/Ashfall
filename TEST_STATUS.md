# ASHFALL Test Status

    ## Last documented status

    The following checks were recorded as passing after Job 004:

    - gradle test
    - gradle run --args="--headless --ticks=120 --seed=ashfall-dev"
    - gradle run --args="--headless --ticks=120 --seed=ashfall-dev --chunk-size=32"
    - gradle run --args="--headless --ticks=120 --seed=ashfall-dev --chunk-size=32 --grid-width=128 --grid-height=128"
    - Browser game checks remain available through the existing pnpm scripts.

    ## This update

    Job 005 verification completed in the Java-enabled checkout:

    - `gradle test --no-daemon` — PASS.
    - `gradle run --no-daemon --args="--headless --ticks=120 --seed=ashfall-dev --chunk-size=32 --grid-width=128 --grid-height=128"` — PASS.
    - Representative benchmark — PASS: 1,024 generated 32 × 32 chunks in
      79.105 ms, about 12,944.8 chunks/second, with a 31,578,736-byte measured
      heap delta after warm-up.

    ## Rule for future jobs

    A job is not complete merely because it compiles. Run the job’s unit tests, relevant integration checks, and benchmark where appropriate. Record exact commands and outcomes here, then update PROJECT_STATE.md and the job record.
    

    ## Job 005 status

    Job 005 is BENCHMARKED. The full test suite, headless engine run, and
    representative generation benchmark all pass.
