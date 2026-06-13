# Beta Onboarding Agent Handoff

Date: 2026-06-12
Project: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`
Production URL: `https://score120coach.com`

## Objective

Make TOEFL 120 Coach ready to invite the first closed beta users.

Do not rebuild the app. Keep the existing product moving forward from its current codebase. Continue with focused refactors, small production fixes, tests, and live verification only where they directly improve beta onboarding readiness.

Do not replace working flows, redesign the app from scratch, create a new architecture, or start a parallel implementation. Preserve the existing deterministic proof loop, Clerk, Convex, readiness endpoint, backup/restore tools, seed content, and learner workflow. Refactor in place when needed.

Do not add OpenAI/model calls, payments, dashboards, or full generated TOEFL tests.

## Current Status

Production is mostly ready, but beta onboarding is not fully cleared until the live manual smoke checks pass.

Already verified:

- `https://score120coach.com/api/readiness` returns `200` with `ready: true`.
- Production readiness checks pass for live Clerk keys, Clerk JWT issuer, Convex production URL, and support email env.
- Public production routes return `200`: `/`, `/beta`, `/support`, `/privacy`, `/terms`, `/korea`.
- Local proof loop smoke test passes.
- Full local Vitest suite passes.
- TypeScript passes.
- ESLint passes.
- `next build --webpack` passes.

Still blocked:

- Live signed-in production sync smoke is not verified.
- Live backup/export/reset/paste-import restore is not verified.
- `support@score120coach.com` deliverability is not verified by sending and receiving a real message.
- No real beta user should be invited until those manual checks pass.

## Required Reading

Read only these first:

1. `AGENTS.md`
2. `docs/beta-operations.md`
3. `docs/convex-production-plan.md`
4. `docs/architecture/TOEFL_Coach_Architecture/README.md`
5. `docs/architecture/TOEFL_Coach_Architecture/APP_AUDIT.md`
6. `docs/architecture/TOEFL_Coach_Architecture/AGENT_TOOL_LOOP_PROTOCOL.md`

Open source files only when needed.

## Source Anchors

- Main app: `components/coach-app.tsx`
- Readiness route: `app/api/readiness/route.ts`
- Env gate: `lib/env.ts`
- Launch gate: `lib/launch-readiness.ts`
- Proof loop: `lib/first-user-loop.ts`, `lib/test-readiness.ts`
- Backup/restore: `lib/backup.ts`
- Tests: `tests/proof-loop-smoke.test.ts`, `tests/launch-readiness.test.ts`, `tests/env.test.ts`, `tests/backup.test.ts`

## Commands To Run First

`npm` may not be available in the Codex shell. If it is missing, use:

```bash
PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
```

Then run:

```bash
vitest run tests/proof-loop-smoke.test.ts --pool=threads
vitest run
tsc --noEmit
eslint .
next build --webpack
```

Production route check:

```bash
curl -fsS https://score120coach.com/api/readiness
for p in / /beta /support /privacy /terms /korea; do curl -fsS -o /dev/null -w "%{http_code} $p\n" "https://score120coach.com$p"; done
```

## Live Manual Smoke Checklist

Use a real test account on `https://score120coach.com`.

1. Sign in with email.
2. Complete profile setup:
   - name
   - target score
   - test date
   - daily minutes
   - confidence by section
3. Complete the diagnostic.
4. Complete one timed mini mock.
5. Add speaking proof:
   - record if browser allows mic access
   - if mic is unavailable, confirm the app clearly falls back to self-rating without pretending audio was saved
6. Add writing proof with a ready-quality response and revision.
7. Open review/readiness and confirm:
   - readiness report appears
   - final command appears
   - exact next drill appears
8. Reload the browser and confirm signed-in progress restores from Convex.
9. Export or show backup JSON.
10. Reset progress.
11. Paste/import the backup.
12. Confirm restored progress returns:
   - profile
   - diagnostic
   - mini mock
   - speaking/writing proof state
   - readiness/report state
13. Send a real support email to `support@score120coach.com`.
14. Confirm the support email arrives in the monitored inbox.

## Pass Criteria

Beta users can be invited only when all are true:

- `/api/readiness` is `ready: true` in production.
- Signed-in user progress survives reload on production.
- Backup export/show, reset, and paste/import restore work on production.
- Support email delivery is confirmed.
- Legal/support/beta pages are live.
- The learner-facing copy keeps the safety claim clear: practice signals are not official TOEFL scores.

## If A Local Blocker Appears

Fix the smallest production-safe issue locally.

Prefer:

- continuing from the current implementation
- refactoring existing code over replacing it
- small patch
- deterministic logic
- regression test
- no new dependencies unless unavoidable
- no new model/API calls

Avoid:

- rewrites
- new app shells
- duplicate onboarding flows
- fake readiness states
- broad UI redesigns unless a verified onboarding blocker requires it

After a code change, run the focused test first, then the full required gates once:

```bash
vitest run <focused-test>
vitest run
tsc --noEmit
eslint .
next build --webpack
```

## What To Report Back

Use this format:

```text
Beta onboarding status:
- Ready / blocked:
- What passed:
- What failed:
- Files changed:
- Tests/build run:
- Production checks run:
- Manual live checks completed:
- Remaining blockers:
- Exact next action:
```

Do not claim production onboarding is ready unless the live signed-in sync, backup restore, and support email checks are actually completed.
