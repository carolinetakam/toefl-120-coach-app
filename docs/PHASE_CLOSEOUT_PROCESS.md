# Phase Closeout Process

Purpose: make every TOEFL 120 Coach implementation phase leave a precise status trail so the next agent can decide intelligently without rereading the whole project.

This process is mandatory for agents working in this repo after any meaningful build, fix, deployment, smoke test, or product phase.

## Required closeout files

At the end of each implementation phase:

1. Create one report under:

```text
docs/implementation-reports/YYYY-MM-DD-short-phase-name.md
```

2. Update `docs/PROJECT_STATUS.md` if any of these changed:
   - beta/launch readiness;
   - verified gates;
   - blockers;
   - production URL/env state;
   - shipped flows;
   - known risks;
   - next decision.

3. Update `docs/NEXT_PHASE_HANDOFF.md` if the next owner, next steps, blockers, or launch path changed.

4. Do not claim beta/public launch readiness unless the exact live/manual checks were completed and recorded.

## Required report template

```md
# Implementation Report: [Phase name]

Date/time:
Repo:
Branch/head:
Owner/agent:

## 1. Status

Done / reduced-scope shipped / blocked

## 2. Objective

What we were trying to accomplish.

## 3. Starting point / handoff used

Which handoff, plan, issue, or document this phase picked up from.

## 4. Files changed

- `path`: what changed and why

## 5. What shipped

Concrete behavior now present in the app.

## 6. What was verified

Commands, URLs, browser flows, or manual checks actually run.

Use exact output summaries, for example:

- `vitest run` -> 24 files / 117 tests passed
- `next build --webpack` -> compiled successfully
- `curl https://score120coach.com/api/readiness` -> `ready:true`

## 7. What remains unverified

Anything not actually checked. Be explicit.

## 8. Beta/onboarding decision

Can users be invited? If not, exactly what blocks it?

## 9. Risks / rollback notes

Known fragile areas, data risks, deployment concerns, or rollback path.

## 10. Next smallest useful step

One concrete next action, with owner and command/checklist when possible.
```

## Closeout verification discipline

Use the smallest gate that proves the change. For code changes, prefer:

```bash
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
vitest run <focused-test> --pool=threads
vitest run
tsc --noEmit
eslint .
next build --webpack
```

For launch/beta changes, also run:

```bash
curl -fsS https://score120coach.com/api/readiness
for p in / /beta /support /privacy /terms /korea; do curl -fsS -o /dev/null -w "%{http_code} $p\n" "https://score120coach.com$p"; done
```

Manual checks must be named as manual. If the agent did not use a real production browser/account/inbox, write **unverified**, not assumed.

## Current standing rule

The project is not cleared for external beta users until all are recorded as passed:

- signed-in production sync smoke;
- backup/export/reset/paste-import restore smoke;
- support email send/receive.
