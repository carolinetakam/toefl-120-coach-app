# Coaching Intelligence Layer v1 Task Plan

Date: 2026-06-15
Source specs:

- `docs/TOEFL 120 Coach — Coaching Intelligence Layer v1 .rtf`
- `docs/Technical Implementation Specification.rtf`
- `docs/Acceptance Test Specification.rtf`

## Objective

Add a deterministic coaching layer to the existing Today screen so a learner can answer four questions within five seconds:

1. What score am I likely to get?
2. What is preventing me from reaching my target score?
3. What should I do next?
4. Am I improving?

This is not a rebuild. Keep the current onboarding, diagnostic, Today, Path, Progress, Library, repair, mini mock, backup, Clerk, and Convex behavior. Coaching v1 is derived from existing `AppState` and does not add AI scoring, new TOEFL content, payments, official ETS claims, or a new navigation system.

## Current Anchors

- Main app state: `lib/types.ts` -> `AppState`
- Today screen integration point: `components/coach-app.tsx`
- Existing progression gates and required repairs: `lib/progression.ts`
- Existing scoring/support logic: `lib/logic.ts`, `lib/reporting.ts`, `lib/planner.ts`
- Existing content evidence: `lib/seed.ts`, `lib/mock-tests.ts`, `lib/content-metadata.ts`
- Current beta blocker remains production smoke, backup/import restore proof, and support email verification from `docs/PROJECT_STATUS.md`.

## Implementation Order

### Phase 0: Prep and Contract Lock

Owner: agent

1. Read the current `AppState`, diagnostic scoring, mini mock scoring, progression gates, and Today rendering code.
2. Confirm available evidence fields:
   - onboarding target score and confidence;
   - diagnostic answers/completion and section scores;
   - practice history;
   - error log and review queue;
   - speaking self-rating/audio evidence;
   - writing draft score;
   - mini mock attempts, score, submitted status, timestamps, timing.
3. Define the exact v1 behavior for insufficient data:
   - no onboarding: target-score setup message, no fake prediction;
   - onboarded/no diagnostic: low confidence, diagnostic as next action;
   - diagnostic only: diagnostic-based prediction;
   - mini mock submitted: mini mock evidence has priority.

Deliverable: short implementation note in the final implementation report.

### Phase 1: Pure Coaching Module

Owner: agent

Create:

- `lib/coaching/types.ts`
- `lib/coaching/predictions.ts`
- `lib/coaching/bottlenecks.ts`
- `lib/coaching/next-action.ts`
- `lib/coaching/trend.ts`
- `lib/coaching/weekly-report.ts`
- `lib/coaching/profile.ts`
- `lib/coaching/index.ts`

Rules:

- `buildCoachingProfile(appState, { now })` is pure and deterministic.
- No network calls.
- No random values.
- No persisted coaching profile as source of truth.
- Clamp sections to `0..30` and total predicted score to `0..120`.
- Use only “Predicted Score” language.
- Return max 3 bottlenecks, sorted by severity.
- Return exactly one best next action.

Highest-ROI implementation details:

1. Prediction:
   - mini mock score first;
   - diagnostic section scores second;
   - practice history third;
   - onboarding confidence fallback last.
2. Confidence:
   - high: diagnostic plus submitted mini mock;
   - medium: diagnostic or meaningful practice;
   - low: onboarding only or insufficient evidence.
3. Bottlenecks:
   - use `errorLog`, `reviewQueue`, diagnostic misses, failed/low practice scores, incomplete speaking/writing/mini mock signals where present;
   - severity formula from the spec: repairs `* 3`, failed attempts `* 2`, low diagnostic signal `* 2`, incomplete submissions `* 1`, clamped `1..10`;
   - convert severity to estimated score loss with the spec bands.
4. Next action:
   - diagnostic first if diagnostic is missing;
   - required repair before optional work;
   - largest bottleneck task if no required repair blocks progression;
   - current unlocked path task;
   - mini mock when enough evidence exists;
   - fallback to Today path.
5. Trend:
   - use real timestamps only;
   - if fewer than 2 chronological points exist, return enough data for an empty-state UI, not fake improvement.
6. Weekly report:
   - generate only with at least 2 points in the current week.

### Phase 2: Unit Tests

Owner: agent

Create:

- `lib/coaching/__tests__/profile.test.ts`
- `lib/coaching/__tests__/predictions.test.ts`
- `lib/coaching/__tests__/bottlenecks.test.ts`
- `lib/coaching/__tests__/next-action.test.ts`
- `lib/coaching/__tests__/trend.test.ts`
- `lib/coaching/__tests__/weekly-report.test.ts`

Required coverage:

- prediction fallback;
- diagnostic-based prediction;
- mini-mock-based prediction;
- score clamping;
- confidence calculation;
- bottleneck detection and ranking;
- score-loss estimation;
- next-action priority order;
- trend ordering and insufficient-history behavior;
- weekly report generation and insufficient-data empty state.

### Phase 3: Today Screen UI

Owner: agent

Create:

- `components/coaching/coaching-snapshot.tsx`
- `components/coaching/bottleneck-card.tsx`
- `components/coaching/next-action-card.tsx`
- `components/coaching/score-trend-card.tsx`
- `components/coaching/weekly-report-card.tsx`

Modify:

- `components/coach-app.tsx`

Today order:

1. Coaching Snapshot
2. Biggest Bottleneck
3. Best Next Action
4. Score Trend
5. Existing Today mission and content

UI requirements:

- calm operational UI that matches existing panels/cards/buttons;
- no official score language;
- no fake trend or fake weekly report;
- next-action Start button opens a real existing task using the current app action/deep-link patterns;
- mobile must not overflow.

### Phase 4: Regression and Backup Behavior

Owner: agent

Verify coaching is derived from state and reacts correctly to:

- new user;
- onboarded user with no diagnostic;
- completed diagnostic;
- required repair blocking progression;
- completed mini mock;
- valid backup import;
- reset progress.

Important rule: reset should clear coaching display because learner state is cleared; re-import should regenerate coaching from imported state.

### Phase 5: Required Automated Verification

Owner: agent

Run from repo root:

```bash
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
vitest run --pool=threads
tsc --noEmit
eslint .
next build --webpack
```

Fix any failures before handoff.

### Phase 6: Manual QA

Owner: agent for local/browser checks, Caroline only for real production account/email checks if credentials or inbox access are unavailable to agents.

Agent checks:

- desktop Chrome local production smoke;
- mobile viewport local production smoke;
- guest mode;
- signed-out state does not show stale personalized coaching;
- backup export/reset/import in local browser if accessible;
- Today, Path, Progress, Library, diagnostic, repair, and mini mock still load.

Caroline checks, nontechnical:

1. Open `https://score120coach.com`.
2. Log in with a real beta test account.
3. Confirm the Today screen says “Predicted Score,” never “Official TOEFL Score,” “ETS Score,” or “Guaranteed Score.”
4. Complete or load a diagnostic and confirm Today shows a predicted score, strongest section, weakest section, bottleneck, and one best next action.
5. Click the Best Next Action Start button and confirm it opens a real task.
6. Export backup, reset progress, paste/import backup, and confirm the coaching cards come back.
7. Send an email to `support@score120coach.com` and confirm it arrives in the monitored inbox.

### Phase 7: Documentation Closeout

Owner: agent

Required before marking complete:

1. Add `docs/implementation-reports/YYYY-MM-DD-coaching-intelligence-layer-v1.md`.
2. Update `docs/PROJECT_STATUS.md` with shipped behavior, verification, and any remaining manual checks.
3. Update `docs/NEXT_PHASE_HANDOFF.md` if the next owner, blocker, or launch path changes.
4. Record exact tests/builds/manual checks.
5. Keep beta blocked unless production smoke, backup/import restore, and support email checks are actually completed and recorded.

## Acceptance Gate

Do not mark Coaching Intelligence Layer v1 complete unless all are true:

- Today shows a coaching snapshot above existing progress content.
- Snapshot includes Predicted Score, Target Score, Score Gap, strongest section, weakest section, and confidence.
- Biggest bottleneck appears from real learner evidence or a truthful empty state appears.
- No more than 3 bottlenecks are generated internally.
- Exactly one Best Next Action appears.
- Best Next Action has a working Start button to a real app task.
- Required repairs outrank optional practice.
- Missing diagnostic recommends diagnostic first.
- Trend uses chronological real points and does not invent improvement.
- Weekly report appears only when enough weekly data exists.
- Guest, signed-out, backup, reset, import, diagnostic, mini mock, repair, Path, Progress, and Library regressions are checked.
- `vitest run --pool=threads`, `tsc --noEmit`, `eslint .`, and `next build --webpack` pass.
- Documentation closeout is complete.

## Explicit Non-Goals

Do not build in this phase:

- AI scoring;
- LLM feedback;
- generated questions;
- new TOEFL content;
- payments or subscriptions;
- badges, leaderboards, or social features;
- major navigation redesign;
- official score guarantees;
- Convex schema changes unless an implementation blocker proves they are necessary.

## Recommended Next Action

Start with Phase 1 plus Phase 2 in one coding pass. The pure module and tests are the highest-ROI foundation because they prove the coaching logic before touching the large Today UI file.
