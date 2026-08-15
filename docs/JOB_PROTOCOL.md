# Job Protocol

Each job record must contain: ID, name, objective, scope, non-goals,
dependencies, files, implementation, tests, benchmark, success criteria, and
status.

The completion sequence is:

Specification → implementation → unit test → integration test → benchmark
where appropriate → documentation → Git commit → push → next job.

Statuses are PLANNED, IN_PROGRESS, BLOCKED, IMPLEMENTED, TESTED, BENCHMARKED,
APPROVED, or DEPRECATED. A job is not complete merely because it compiles.