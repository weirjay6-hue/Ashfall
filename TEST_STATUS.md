# ASHFALL Test Status

    ## Last documented status

    The following checks were recorded as passing after Job 004:

    - gradle test
    - gradle run --args="--headless --ticks=120 --seed=ashfall-dev"
    - gradle run --args="--headless --ticks=120 --seed=ashfall-dev --chunk-size=32"
    - gradle run --args="--headless --ticks=120 --seed=ashfall-dev --chunk-size=32 --grid-width=128 --grid-height=128"
    - Browser game checks remain available through the existing pnpm scripts.

    ## This update

    The current control-layer update changes documentation only. Tests were not rerun because no game or engine source was accessed or modified.

    ## Rule for future jobs

    A job is not complete merely because it compiles. Run the job’s unit tests, relevant integration checks, and benchmark where appropriate. Record exact commands and outcomes here, then update PROJECT_STATE.md and the job record.
    

## Job 005 status

Focused generator tests have been added but are not yet marked passing. Run the full engine test suite and a representative generation benchmark before changing Job 005 to TESTED.
