# Coaching Intelligence Layer v1 Agent Prompts

Date: 2026-06-15
Use with: `docs/coaching-intelligence-layer-v1-task-plan.md`

## How To Use

Prefer one coding agent for Prompts 0-4 when possible. Splitting every prompt into a different agent adds repeated context reads, duplicated builds, and slower handoffs. Start with Prompt 0 if the agent has not already read the project context. For fastest progress, Prompt 1 and Prompt 2 should usually be combined because the pure module and unit tests belong together.

Do not ask Caroline to do technical work. Agent-owned prompts must include implementation, verification, and a concise handoff.

Every coding agent must follow the project `AGENTS.md` required reading route before changing code. For frontend work, also follow the frontend package reading route listed in `AGENTS.md`.

Use focused checks while building. Run the full gate once after implementation and focused regressions are stable:

```bash
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
vitest run --pool=threads
tsc --noEmit
eslint .
next build --webpack
```

Do not run repeated full builds between small subtasks unless a build-specific failure is being fixed. Record exact commands and results in the handoff.

## Prompt 0: Prep And Contract Lock

```text
You are working in /Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only.

Task: prepare the Coaching Intelligence Layer v1 implementation contract.

Read, in this order:
1. AGENTS.md
2. docs/PROJECT_STATUS.md
3. docs/NEXT_PHASE_HANDOFF.md
4. docs/coaching-intelligence-layer-v1-task-plan.md
5. lib/types.ts
6. lib/logic.ts
7. lib/progression.ts
8. lib/reporting.ts
9. components/coach-app.tsx only around imports, state setup, Today rendering, diagnostic submit, practice submit, mini mock submit, backup import/reset.

Output a short implementation note that confirms:
- which AppState fields can support prediction;
- which AppState fields can support bottlenecks;
- which existing functions/routes/actions should power the Best Next Action Start button;
- what empty states are required for no onboarding, no diagnostic, no trend history, and insufficient weekly data;
- whether Convex schema changes are unnecessary for v1.

Do not edit app code in this prompt unless you find a blocker that prevents planning.
Keep the answer concise and implementation-ready.
```

## Prompt 1: Pure Coaching Module

```text
You are working in /Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only.

Task: implement the pure deterministic Coaching Intelligence Layer v1 module.

Required context:
- Follow AGENTS.md.
- Use docs/coaching-intelligence-layer-v1-task-plan.md as the source of truth.
- Do not rebuild the app.
- Do not add AI, LLM calls, generated content, payments, official score claims, or a new navigation system.
- Do not change Convex schema unless a real implementation blocker proves it is necessary.

Create:
- lib/coaching/types.ts
- lib/coaching/predictions.ts
- lib/coaching/bottlenecks.ts
- lib/coaching/next-action.ts
- lib/coaching/trend.ts
- lib/coaching/weekly-report.ts
- lib/coaching/profile.ts
- lib/coaching/index.ts

Implement:
- buildCoachingProfile(appState, options?: { now?: Date })
- predictScore(appState)
- detectBottlenecks(appState)
- getNextBestAction(appState, bottlenecks)
- buildScoreTrend(appState)
- buildWeeklyReport(appState, trend, bottlenecks, options?: { now?: Date })

Rules:
- All functions must be pure and deterministic.
- No network calls.
- No random values.
- Use existing AppState from lib/types.ts as source of truth.
- Predicted total score must clamp 0..120.
- Section scores must clamp 0..30.
- Mini mock evidence has priority over diagnostic evidence.
- Diagnostic evidence has priority over practice history.
- Practice history has priority over onboarding confidence fallback.
- Confidence is high only when diagnostic plus at least one submitted mini mock exist.
- Confidence is medium when diagnostic or meaningful practice exists.
- Confidence is low for onboarding-only or insufficient evidence.
- Bottlenecks must use real existing evidence only: diagnostic misses, errorLog, reviewQueue, low/failed practice, incomplete submissions, mini mock outcomes, writing/speaking signals where available.
- Return max 3 bottlenecks, sorted by severity descending.
- Return exactly one NextAction.
- Missing diagnostic should recommend diagnostic first.
- Required repairs/progression blockers should outrank optional practice.
- Trend must not invent history.
- Weekly report must return undefined unless enough weekly data exists.

Before final response, run focused checks:
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
vitest run lib/coaching --pool=threads
tsc --noEmit

Final response:
- list files changed;
- summarize behavior;
- mention tests/checks run and any failures.
```

## Prompt 2: Coaching Unit Tests

```text
You are working in /Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only.

Task: add unit tests for the Coaching Intelligence Layer v1.

Required context:
- Follow AGENTS.md.
- Use docs/coaching-intelligence-layer-v1-task-plan.md.
- Inspect lib/coaching/* and existing test style before writing tests.

Create:
- lib/coaching/__tests__/profile.test.ts
- lib/coaching/__tests__/predictions.test.ts
- lib/coaching/__tests__/bottlenecks.test.ts
- lib/coaching/__tests__/next-action.test.ts
- lib/coaching/__tests__/trend.test.ts
- lib/coaching/__tests__/weekly-report.test.ts

Required tests:
- prediction fallback with low confidence when no diagnostic exists;
- diagnostic-based prediction;
- mini-mock-based prediction outranks diagnostic;
- section score clamping 0..30;
- total score clamping 0..120;
- confidence high/medium/low calculation;
- no-evidence bottleneck empty or truthful low-evidence behavior;
- repair-heavy section ranks highest;
- bottlenecks cap at 3;
- estimated score loss follows severity bands;
- diagnostic is recommended first when missing;
- required repair is recommended before optional work;
- largest bottleneck task is recommended when no required repair blocks progression;
- exactly one next action is always returned;
- next action has title, reason, href, estimatedMinutes, expectedImpact, priority, and section;
- trend does not invent fake history;
- trend points are chronological;
- weekly report returns undefined with insufficient trend data;
- weekly report calculates improvement and identifies strongest/weakest section.

Run focused checks:
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
vitest run lib/coaching --pool=threads
tsc --noEmit

Fix failures you cause.

Final response:
- list test files added;
- summarize coverage;
- report exact commands and pass/fail status.
```

## Prompt 3: Today Screen UI Integration

```text
You are working in /Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only.

Task: integrate Coaching Intelligence Layer v1 into the Today screen.

Required context:
- Follow AGENTS.md.
- For frontend work, read the required frontend package files listed in AGENTS.md before editing UI.
- Use docs/coaching-intelligence-layer-v1-task-plan.md.
- Inspect current components/coach-app.tsx Today rendering and existing CSS patterns.

Create:
- components/coaching/coaching-snapshot.tsx
- components/coaching/bottleneck-card.tsx
- components/coaching/next-action-card.tsx
- components/coaching/score-trend-card.tsx
- components/coaching/weekly-report-card.tsx

Modify:
- components/coach-app.tsx
- app/globals.css only if existing classes cannot support polished layout.

Implement:
- Compute coachingProfile from current AppState with useMemo.
- Place coaching UI at the top of the Today screen, above existing Today mission/progress content.
- Order: Coaching Snapshot, Biggest Bottleneck, Best Next Action, Score Trend, Weekly Report if present, then existing Today content.
- Snapshot must show Predicted Score, Target Score, Score Gap, Strongest Section, Weakest Section, Confidence.
- Bottleneck card must show top bottleneck or truthful empty state.
- Next Action card must show exactly one action with title, reason, estimated time, expected impact, and Start button.
- Start button must open a real existing app task/action. Use current app patterns such as startSprintAction, setTab, selectPracticeCard, diagnostic continuation, or current Today path behavior. Do not invent a route system.
- Trend card must show movement only with 2+ real points; otherwise show “Not enough history yet.”
- Weekly report card must render only when weeklyReport exists.
- UI must never use “Official TOEFL Score,” “ETS Score,” or “Guaranteed Score.”
- Mobile must not overflow.
- Signed-out users must not see stale personalized coaching.
- Guest mode may show derived local coaching only after explicit guest entry.

Run focused checks first:
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
vitest run lib/coaching --pool=threads
tsc --noEmit
eslint .

Final response:
- list files changed;
- summarize UI behavior;
- report commands and pass/fail status;
- note any manual browser checks still needed.
```

## Prompt 4: Regression, Backup, Reset, Import

```text
You are working in /Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only.

Task: verify and fix Coaching Intelligence Layer v1 regression behavior for app flows, backup, reset, and import.

Required context:
- Follow AGENTS.md.
- Use docs/coaching-intelligence-layer-v1-task-plan.md.
- Inspect backup/import/reset code in components/coach-app.tsx and lib/backup.ts.

Verify these states:
- brand-new user: no fake predicted score, target-score setup guidance;
- onboarded but no diagnostic: diagnostic is Best Next Action, confidence low;
- diagnostic completed: predicted score, strongest/weakest section, bottleneck, and next action appear;
- required repair blocks progression: Best Next Action is required repair;
- completing required repair changes recommendation;
- submitted mini mock: prediction prioritizes mini mock evidence;
- valid backup import: coaching regenerates from imported state;
- reset: coaching-derived display clears with learner state;
- re-import: coaching display returns from imported state;
- signed-out state: no stale personalized coaching.

Fix only real regressions. Keep changes scoped.

Run focused regression checks first:
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
vitest run lib/coaching --pool=threads
tsc --noEmit
eslint .

If a local browser production smoke is practical, run:
next build --webpack
next start --hostname localhost --port 3002
Then check desktop and mobile viewport manually or with Browser/Playwright.

Final response:
- list any fixes made;
- list exact regression scenarios checked;
- report commands and pass/fail status;
- note remaining production-only checks.
```

## Prompt 5: Full Automated Verification

```text
You are working in /Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only.

Task: run the full required automated verification for Coaching Intelligence Layer v1 and fix failures caused by this phase.

Required context:
- Follow AGENTS.md.
- Use docs/coaching-intelligence-layer-v1-task-plan.md.
- Do not broaden scope beyond fixing test/type/lint/build failures.

Run:
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
vitest run --pool=threads
tsc --noEmit
eslint .
next build --webpack

If any command fails:
- inspect the failure;
- fix the smallest real issue;
- rerun the failing command;
- rerun the full gate once all focused failures are fixed.

Final response:
- report each command and result;
- list fixes made;
- state whether the automated gate is clear.
```

## Prompt 6: Manual QA And Browser Smoke

```text
You are working in /Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only.

Task: perform local manual/browser QA for Coaching Intelligence Layer v1.

Required context:
- Follow AGENTS.md.
- Use docs/coaching-intelligence-layer-v1-task-plan.md.
- Use the Browser plugin or Playwright if available for local UI checks.

Start local production build if needed:
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
next build --webpack
next start --hostname localhost --port 3002

Check:
- desktop Today screen;
- mobile viewport Today screen;
- new user empty state;
- guest mode;
- signed-out state does not show stale personalized coaching;
- onboarding/profile setup;
- diagnostic flow enough to unlock coaching;
- Today coaching snapshot uses “Predicted Score” only;
- no “Official TOEFL Score,” “ETS Score,” or “Guaranteed Score” appears;
- Best Next Action Start button opens a real task;
- Path screen loads;
- Progress screen loads;
- Library screen loads;
- backup export/reset/import if accessible locally;
- no obvious mobile overflow.

Fix small UI bugs found during QA. Do not start broad redesign.

Final response:
- list browser/device/viewports checked;
- list issues found and fixed;
- list remaining checks that require Caroline or production credentials.
```

## Prompt 7: Documentation Closeout

```text
You are working in /Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only.

Task: complete documentation closeout for Coaching Intelligence Layer v1.

Required context:
- Follow AGENTS.md.
- Read docs/PHASE_CLOSEOUT_PROCESS.md.
- Use docs/coaching-intelligence-layer-v1-task-plan.md.
- Inspect git diff and actual verification results before writing docs.

Create:
- docs/implementation-reports/YYYY-MM-DD-coaching-intelligence-layer-v1.md

Update:
- docs/PROJECT_STATUS.md if shipped behavior, readiness, blockers, or verification changed.
- docs/NEXT_PHASE_HANDOFF.md if next owner, next step, blocker, or launch path changed.

The implementation report must include:
- status;
- objective;
- source specs used;
- files created;
- files modified;
- behavior shipped;
- exact tests/builds run and pass/fail results;
- browser/manual checks run;
- known limitations;
- production checks still required;
- beta/onboarding decision.

Rules:
- Do not claim external beta readiness unless production signed-in sync, backup/export/reset/import restore, and support email send/receive are actually verified and recorded.
- Do not hide failed or skipped checks.
- Keep the next highest-ROI action clear.

Final response:
- list docs changed;
- summarize launch/beta status accurately;
- report any remaining blockers.
```

## Prompt 8: Caroline Production QA

```text
Caroline, please run this nontechnical production check only after the implementation is deployed.

1. Open https://score120coach.com.
2. Log in with a real beta test account.
3. Confirm the Today screen says “Predicted Score.”
4. Confirm the page does NOT say “Official TOEFL Score,” “ETS Score,” or “Guaranteed Score.”
5. Complete or load a diagnostic.
6. Confirm Today shows:
   - predicted score;
   - target score;
   - score gap;
   - strongest section;
   - weakest section;
   - confidence;
   - biggest bottleneck;
   - one Best Next Action.
7. Click the Best Next Action Start button and confirm it opens a real task.
8. Export backup.
9. Reset progress.
10. Paste/import the backup.
11. Confirm the coaching cards come back.
12. Send an email to support@score120coach.com.
13. Confirm the email arrives in the monitored inbox.

Send the agent:
- pass/fail for each step;
- browser used;
- any screenshot if something looks wrong.
```

## Best Execution Sequence

1. Prompt 0
2. Prompt 1 and Prompt 2 together
3. Prompt 3
4. Prompt 4
5. Prompt 5 once, after implementation stabilizes
6. Prompt 6 after the full automated gate passes
7. Prompt 7
8. Prompt 8 only after deployment
