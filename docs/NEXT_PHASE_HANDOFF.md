# Next Phase Handoff: Beta Clearance to Official Launch

Last updated: 2026-06-14 01:54 KST  
Project: TOEFL 120 Coach  
Repo: `/Users/carolinetakam/Documents/apps/toefl-120-coach-app-only`  
Production: `https://score120coach.com`

## Handoff summary

The codebase is a working beta candidate. Automated local gates pass and production public routes are live. The next phase is **not more feature building first**. The next phase is clearing the manual production trust gates, inviting a tiny beta cohort, then hardening only what real beta use exposes.

## Current launch decision

- **Founder/internal smoke:** allowed now.
- **External closed beta:** blocked until manual production smoke passes.
- **Official public launch:** blocked until beta cohort evidence, event-based backend hardening, support operations, accessibility/security review, and payment/entitlement decisions are complete.

## Next owner route

1. **Beta Clearance Agent / Coding Agent** — perform production smoke and fix only blockers.
2. **Beta Operations Agent** — invite and track first 5 Korean learners after smoke passes.
3. **Coding Agent** — patch P0/P1 beta issues; no broad redesign.
4. **Backend Agent** — migrate from full-state snapshots to event-based Convex mutations before paid/public launch.
5. **Launch Agent** — prepare official launch checklist, support flow, analytics, and sales pages after beta signal.

## Phase 1: Clear closed-beta gate

### Goal

Prove that real users can safely sign in, complete the first TOEFL loop, recover data, and contact support.

### Required steps

1. Open `https://score120coach.com` in a real browser.
2. Sign in with a real beta test account.
3. Complete profile setup.
4. Complete diagnostic.
5. Complete one timed mini mock.
6. Confirm review/readiness/next drill appear.
7. Reload production and verify signed-in progress restores from Convex.
8. Export/show backup JSON.
9. Reset progress.
10. Paste/import backup.
11. Confirm profile, diagnostic, mini mock, and readiness state restore.
12. Send a real email to `support@score120coach.com`.
13. Confirm the email arrives in the monitored inbox.
14. Record results in a new `docs/implementation-reports/YYYY-MM-DD-production-smoke.md` file.
15. Update `docs/PROJECT_STATUS.md`.

### Pass criteria

- Production readiness API remains `ready:true`.
- Public pages stay HTTP 200.
- Signed-in sync survives reload.
- Backup/reset/import restore works.
- Support email is confirmed.
- No learner-facing flow claims official TOEFL scoring.

### If this phase fails

Fix only the smallest verified blocker. Preferred order:

1. auth/sync break;
2. backup/reset/import break;
3. mock submission or review break;
4. support route/email copy issue;
5. confusing copy that blocks completion.

Run focused tests first, then full gates only once after the fix:

```bash
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
vitest run <focused-test> --pool=threads
vitest run
tsc --noEmit
eslint .
next build --webpack
```

## Phase 2: First 5-user Korean closed beta

### Goal

Learn whether the product delivers first-session value without Caroline manually explaining it.

### Scope

Invite **5 Korean TOEFL learners maximum**. Do not expand until every learner either completes Day 1 or reports why they stopped.

### Learner path to verify

1. Sign in.
2. Set profile.
3. Finish diagnostic.
4. Complete one mini mock.
5. Check Today plan.
6. Visit Support page.
7. Return for Day 2 if possible.

### Track per learner

- signup email;
- device/browser;
- target score and test date;
- onboarding completion;
- diagnostic completion;
- mini mock completion;
- first confusion point;
- sync/support issue;
- scoring concern;
- whether Today’s next action made sense;
- whether they returned on Day 2.

### Product changes allowed during beta

Allowed:

- P0/P1 bug fixes;
- copy clarifications;
- onboarding friction removal;
- mobile layout fixes;
- repair/review flow fixes;
- support diagnostics.

Not allowed unless Caroline explicitly changes scope:

- payments;
- broad redesign;
- full generated TOEFL mock tests;
- live AI scoring;
- coach dashboards;
- new app shell/rebuild.

## Phase 3: Beta hardening

### Goal

Turn first-cohort proof into a stable product that can support more users without manual rescue.

### Highest-value technical work

1. Convert current full-state sync into event-based Convex mutations:
   - `saveProfile`
   - `finishDiagnostic`
   - `recordObjectiveResult`
   - `submitMockTest`
   - `submitWriting`
   - `submitSpeaking`
   - `reviewCard`
   - `importSnapshot`
   - `deleteMyData`
2. Make mini mock attempts immutable after submit.
3. Add idempotent submit and autosave for mini mock answers, writing drafts, and speaking notes/checklists.
4. Keep deterministic scoring as the default.
5. Add minimal analytics/events for:
   - onboarding start;
   - onboarding completion;
   - diagnostic completion;
   - first mini mock submit;
   - first review opened;
   - next drill started;
   - return on Day 2;
   - support contact opened.
6. Add production support diagnostics per user.
7. Add accessibility pass for the core loop.

### Acceptance

- Refresh during test does not lose answers.
- Duplicate submit does not duplicate score or progress.
- Completed attempt always renders a report.
- Admin/support can diagnose sync failures by user without seeing unrelated user data.
- Core mobile path has no blocking layout defects.

## Phase 4: Official launch preparation

### Goal

Prepare a public product launch only after closed beta proves retention and trust.

### Required before official launch

- Closed beta cohort report with user evidence.
- P0/P1 issues resolved.
- Event-based backend mutations live.
- Immutable attempts and restore path verified.
- Support SOP and monitored inbox confirmed.
- Privacy/terms reviewed against actual data behavior.
- Accessibility pass on core loop.
- Security review of Clerk/Convex data ownership boundaries.
- Monitoring/alerting for readiness, sync errors, and support contact failures.
- Decision on pricing/payments/entitlements; implement only if paid launch is intended.
- Honest marketing copy that says practice signals are not official TOEFL scores.

### Launch no-go conditions

Do not officially launch if any are true:

- production sign-in/sync is unreliable;
- data restore/delete is unverified;
- support inbox is not monitored;
- scoring copy implies official ETS results;
- first 5 beta learners cannot complete the first loop without manual help;
- tests/build do not pass on the release commit.

## Minimum command checklist for next coding owner

```bash
cd /Users/carolinetakam/Documents/apps/toefl-120-coach-app-only
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
vitest run
tsc --noEmit
eslint .
next build --webpack
curl -fsS https://score120coach.com/api/readiness
for p in / /beta /support /privacy /terms /korea; do curl -fsS -o /dev/null -w "%{http_code} $p\n" "https://score120coach.com$p"; done
```

## Files next agent should read first

1. `AGENTS.md`
2. `docs/PROJECT_STATUS.md`
3. `docs/PHASE_CLOSEOUT_PROCESS.md`
4. `docs/beta-onboarding-agent-handoff.md`
5. `docs/beta-operations.md`
6. `docs/convex-production-plan.md`
7. `components/coach-app.tsx` only if UI behavior must be fixed
8. `lib/launch-readiness.ts`, `lib/backup.ts`, `lib/first-user-loop.ts`, `lib/progression.ts` only if launch/restore/proof behavior must be fixed
