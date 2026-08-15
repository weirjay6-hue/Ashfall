# AI Development Workflow

Every fresh session must read the README, master design, current state,
roadmap, job protocol, and the active job before changing code. It must inspect
Git status, branch, history, build status, and tests.

Implement one job only. Test it, benchmark where relevant, update
documentation, review the diff, commit with a meaningful message, and push
when authorized. If something fails, isolate the smallest responsible
subsystem and add a regression test.