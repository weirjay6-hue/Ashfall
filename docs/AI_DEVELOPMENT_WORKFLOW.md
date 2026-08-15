# AI Development Workflow

Every fresh session must read the README, master design, current state,
roadmap, job protocol, and the active job before changing code. It must inspect
Git status, branch, history, build status, and tests.

Implement one job only. Test it, benchmark where relevant, update
documentation, review the diff, commit with a meaningful message, and push
when authorized. If something fails, isolate the smallest responsible
subsystem and add a regression test.

## Fresh-session resource gate

A fresh Replit session must begin with the root control files: REPLIT_START_HERE.md, PROJECT_STATE.md, NEXT_TASK.md, SYSTEM_MAP.md, and TEST_STATUS.md. Read only those files plus docs/JOB_PROTOCOL.md and the active job record before accessing source.

Do not mount or broadly scan artifacts/ashfall, engine, lib, or attached_assets during orientation. Do not run dependency installation, full builds, asset generation, or repository-wide searches before the active job identifies a relevant subsystem. Use the smallest relevant file set, implement one job, test it, update the control files, commit, and push.
