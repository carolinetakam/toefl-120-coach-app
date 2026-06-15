# TOEFL 120 Coach Project Status

Last updated: 2026-06-15 22:11 KST
Repo: `/Users/carolinetakam/Documents/apps/toefl-120-coach-app-only`  
Production URL: `https://score120coach.com`  
Current branch: `main`  
Current head when reviewed: local changes after `5be3ea0 docs: add live sync smoke handoff`

## Executive status

**Status: beta candidate, but not cleared for external beta onboarding yet.**

The app is technically building, the local automated suite passes, production public routes are live, and `/api/readiness` reports environment readiness. The remaining blockers are **live/manual checks** that cannot be honestly claimed from code inspection alone:

1. signed-in production sync smoke test with a real account — **failed on 2026-06-15 because Convex production rejected saved app state fields; backend validator fix deployed, full browser/account matrix still must be retested**;
2. backup/export/reset/paste-import restore smoke test on production;
3. real support email send/receive verification for `support@score120coach.com`.

**Decision:** Caroline can use the app for founder/internal smoke testing now. Do **not** invite the first 5 external Korean beta learners until the three manual live checks above pass and are recorded in this document or a new implementation report.

## What we originally set out to do

From the architecture handoff and app audit, the first sale-ready path was not a rebuild. The target was the smallest reliable TOEFL learner loop:

1. profile setup;
2. diagnostic or mini mock;
3. review;
4. exact next drill;
5. saved progress;
6. production-safe beta onboarding with clear scoring limits.

The roadmap also required low-cost deterministic behavior first: use existing seed content, strategy cards, static cues, rule-based scoring, and Convex/Clerk sync before adding AI scoring, payments, dashboards, or full generated mock tests.

## Current product reality

### Shipped / present

- Next.js app router app with production routes for `/`, `/beta`, `/support`, `/privacy`, `/terms`, `/korea`.
- Clerk auth integration and Convex signed-in full-state sync path.
- Local guest mode with browser storage.
- Onboarding profile inputs: target score, test date, daily minutes, confidence by section.
- Diagnostic across Reading, Listening, Speaking, and Writing.
- Today/Path/Progress/Library-style learner flow in `components/coach-app.tsx`.
- Progression lock logic in `lib/progression.ts`:
  - diagnostic required before full library access;
  - one repair/review signal required before mini mock proof;
  - path days are current/completed/locked/optional based on saved evidence.
- First-user proof loop helpers in `lib/first-user-loop.ts`.
- Mini mock/practice seed content in `lib/mock-tests.ts` and `lib/seed.ts`.
- TOEFL strategy layer in `lib/content-metadata.ts`, `lib/sprint.ts`, and UI wiring:
  - approved seed metadata;
  - strategy card IDs;
  - cues, traps, timing, explanations, repair rules;
  - strategy reveal/open behavior from Today.
- Integrated speaking/writing content model support now distinguishes answerable learner tasks from summary-only/template-only support materials and refuses to score incomplete integrated tasks.
- Practice and mini mock speaking/writing UI now exposes source materials, structure templates, examples, task timers, and structure checklists while hiding answer submission for support-only/template-only material.
- Model Answer & Compare Workflow v1 is implemented locally for Speaking and Writing practice plus mini mock tasks: every Speaking/Writing seed task has an approved static model answer, in-task `What ETS Wants`/`Model Answer` cards, and a checklist-only post-submit compare card. No AI scoring, GPT feedback, official TOEFL score claim, or audio-based scoring was added.
- Sidebar settings now provide local preferences for timers, templates, and examples plus quick microphone help access. Theme mode was not added because the app is currently light-only.
- Coaching Intelligence Layer v1 now derives a deterministic coaching profile from saved app state: predicted score availability/confidence, bottlenecks, next best action, score trend, and weekly report. It uses no AI calls, network calls, persistence changes, or official ETS score claims.
- Today now shows Coaching Snapshot, Biggest Bottleneck, Best Next Action, Score Trend, and Weekly Report cards when enough learner evidence exists. Best Next Action routes into existing diagnostic, review, Path, or Library work rather than a placeholder.
- Deterministic scoring/reporting; no official ETS score claim.
- Launch readiness gate in `lib/launch-readiness.ts`.
- Backup/restore support in `lib/backup.ts`.
- Production readiness API: `app/api/readiness/route.ts`.

### Not shipped / not production-cleared

- Live signed-in sync smoke has partial positive evidence: Caroline reported on 2026-06-15 after the validator and auth-state fixes that a previously tested account restored data after logout/login and also restored in incognito. This is not full beta clearance because different-account isolation, Safari, backup/restore, and support email remain unverified.
- Backup export has partial positive evidence: Caroline provided `/Users/carolinetakam/Downloads/toefl-120-coach-backup-2026-06-15.json`, which parsed as a valid TOEFL backup with profile, diagnostic, progress, review, mini mock, and speaking attempt data. Reset/import restore remains unverified.
- Reset has user-reported positive evidence. The import button was inaccessible after reset until diagnostic was redone; after the visibility fix, Caroline reported the import access now works. Actual imported-data restore correctness remains unverified.
- Root cause found: production `coach:saveAppState` mutations reached Convex but failed argument validation because the deployed backend validator did not accept `state.diagnosticFormId` and `state.speakingAttempts[].hasAudioEvidence`. Convex production was redeployed with the current validator and a backend-only synthetic save/restore check passed.
- A patch now adds explicit sign out/switch controls and prevents one signed-in account from inheriting another account’s local browser progress. The live browser/account matrix still must be retested before beta clearance.
- Local auth-state hardening now prevents signed-out/loading users from seeing stale personalized workspace content, adds explicit `Log In`, `Continue as Guest`, and `Create Account` actions, and makes guest mode explicit/local-only. This is verified locally but not yet deployed or tested with a real production Clerk account.
- Local recording UX hardening now preserves task context when opening recording from Path/Mini Mock, shows a dominant recorder panel with duration/playback/re-record controls, and adds blocked microphone fallback actions for Self-Rating Mode, microphone help, and returning to the exercise. This is verified locally but not yet deployed or tested with a real microphone in production.
- A local recording playback MIME fix now creates playback blobs with the browser-supported recorder MIME type instead of always forcing `audio/webm`. This targets the screenshot issue where the browser audio control showed `Error` after recording. Live microphone retest remains required.
- Local P1 progress/completion UX is now complete: required path days need all required submitted actions, locked days name missing required repairs, Path/Progress missing repairs are clickable, and submitted work shows a next-step prompt. This is verified locally but not yet deployed.
- Local integrated-materials, timer/structure, and settings/preferences UX is implemented and verified locally. Production deployment and live learner smoke remain unverified.
- Local Coaching Intelligence Layer v1 module, Today UI, regression coverage, full automated gate, and desktop/mobile guest browser QA are complete. Production signed-in coaching-card QA remains unverified.
- Local Model Answer & Compare Workflow v1 is implemented and verified in guest browser QA. Production deployment and signed-in production persistence/display remain unverified.
- No verified live backup/export/reset/paste-import restore smoke test in this phase.
- No verified real support email send/receive loop in this phase.
- Attempts are still primarily full-state/client-flow based, not a fully event-based immutable attempt engine.
- Speaking recordings are not durable production uploads; current behavior is local/browser-oriented with checklist/self-rating fallback.
- No AI gateway, token/cost dashboard, or model scoring pipeline yet. This is acceptable for beta because deterministic scoring is the current intended path.
- No payments/subscriptions. This is intentionally deferred.
- No full generated TOEFL mock-test system. This is intentionally deferred.

## Verification status from this closeout

Commands were run from `/Users/carolinetakam/Documents/apps/toefl-120-coach-app-only` with:

```bash
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
```

| Gate | Result | Evidence |
| --- | --- | --- |
| Full Vitest suite | PASS | `vitest run --pool=threads` -> 34 test files passed, 152 tests passed after Model Answer & Compare Workflow coverage |
| TypeScript | PASS | `tsc --noEmit` completed after build regenerated `.next/types`; an earlier parallel run failed while `.next/types` was being regenerated |
| ESLint | PASS | `eslint .` completed before closeout |
| Production build | PASS | `next build --webpack` compiled and generated 9 static pages |
| Local model-answer browser QA | PASS | `next start --port 3002` + bundled headless Chromium verified guest onboarding/diagnostic, Library > Speaking in-task Model Answer/What ETS Wants, post-submit Compare Yourself checklist, no AI/audio-scoring claims, and no desktop/mobile horizontal overflow |
| Local production UI smoke | PASS with auth-provider warnings | `next start --port 3002` returned HTTP 200; headless Chromium verified guest mode after auth timeout, Settings panel, Mic help, and active Timers/Templates/Examples toggles on desktop/mobile. Local Clerk resource calls returned two 400 errors, matching local auth-provider checks rather than app runtime exceptions. |
| Local coaching browser QA | PASS with auth-provider warnings | Headless Chromium verified desktop/mobile Today coaching cards, guest banner, no horizontal overflow, no forbidden score claims, Best Next Action opening a real Library task, and Path/Progress/Library tab loads. |
| Coaching unit/regression tests | PASS | `vitest run lib/coaching --pool=threads` -> 7 files / 23 tests covering prediction priority, bottlenecks, next action, trend, weekly report, reset, and backup import regeneration. |
| Production readiness API | PASS with manual checks still required | `https://score120coach.com/api/readiness` returned `ready:true`, `audit.ready:true`, `manualReviewRequired:true` |
| Public production routes | PASS | `/`, `/beta`, `/support`, `/privacy`, `/terms`, `/korea` all returned HTTP 200 |
| Convex production validator deploy | PASS | `convex deploy --env-file /tmp/toefl-convex-prod.env --message "fix app state validator for production sync"` deployed to `brainy-chicken-240` |
| Backend-only sync shape smoke | PASS | Synthetic `coach:saveAppState` + `coach:getAppState` accepted `diagnosticFormId`, `hasAudioEvidence`, and `miniMockAttempts`; synthetic app snapshot was deleted |
| Local logout/guest auth UI | PASS locally | Production-mode local Chrome check verified signed-out prompt/actions, guest banner/actions, and mobile no-overflow |
| Same-account logout/login + incognito restore | USER-REPORTED PASS | Caroline reported data restored after logout/login and in incognito for an account tested earlier |
| Backup export | USER-PROVIDED FILE PASS | `toefl-120-coach-backup-2026-06-15.json` parsed successfully and contains meaningful learner state |
| Reset progress | USER-REPORTED PASS | Caroline reported reset works |
| Import access after reset | USER-REPORTED PASS | Caroline reported the import access fix works after `6d437aa`; imported-data correctness still unverified |

Important tool note: `npm` was not available on the default shell PATH. Use the Node runtime path above and direct binaries (`vitest`, `tsc`, `eslint`, `next`) unless the shell PATH is fixed.

## Can we onboard beta users?

**External beta users: not yet.**

The app is close, but beta onboarding should remain blocked until these are verified manually on production:

- [ ] Real test account can sign in on `https://score120coach.com`.
- [ ] Profile, diagnostic, and one mini mock can be completed in production.
- [ ] Today coaching cards appear for a signed-in production learner after diagnostic/mini mock evidence, and Best Next Action opens real work.
- [ ] Reload after signed-in work restores progress from Convex.
- [ ] Backup/export or show-backup JSON works.
- [ ] Reset progress works.
- [ ] Paste/import backup restores the same meaningful state.
- [ ] A real email sent to `support@score120coach.com` arrives in the monitored inbox.

**Internal/founder testing: yes.** Use production now to complete the smoke checklist. If it passes, invite only the first 5 Korean learners as described in `docs/beta-operations.md`.

## Current highest-risk areas

1. **Manual production sync incomplete:** Same-account logout/login and incognito restore are user-reported passing, but different-account isolation and Safari still need production browser verification.
2. **Backup/reset trust incomplete:** Backup export, reset, and import access have positive evidence, but imported-data restore correctness is not proven.
3. **Coaching production account QA incomplete:** Coaching cards are locally verified in guest mode, but signed-in production persistence/display still needs the production smoke above.
4. **Support deliverability unknown:** Beta users need a real support path before invitation.
5. **Full-state sync is transitional:** Good enough for first beta if smoke-tested; should become event-based before paid/public launch.
6. **Speaking/audio durability:** Do not market durable audio review yet.

## Canonical docs for agents

Start with these instead of scanning every file:

1. `AGENTS.md`
2. `docs/PROJECT_STATUS.md` — this file, current precise state
3. `docs/implementation-reports/2026-06-15-production-sync-validator-fix.md` — current root cause, backend fix, evidence, and remaining browser matrix
4. `docs/NEXT_PHASE_HANDOFF.md` — next steps to official launch
5. `docs/implementation-reports/` — reports after each implementation phase
6. `docs/beta-onboarding-agent-handoff.md`
7. `docs/beta-operations.md`
8. `docs/convex-production-plan.md`
9. `docs/architecture/TOEFL_Coach_Architecture/APP_AUDIT.md`
10. `docs/architecture/TOEFL_Coach_Architecture/REFACTOR_ROADMAP.md`

## Rule going forward

At the end of every build/implementation phase, update:

1. `docs/PROJECT_STATUS.md` if the state changed;
2. one new file under `docs/implementation-reports/YYYY-MM-DD-short-phase-name.md`;
3. `docs/NEXT_PHASE_HANDOFF.md` if the next owner, blocker, or launch path changed.

Use `docs/PHASE_CLOSEOUT_PROCESS.md` as the required template.
