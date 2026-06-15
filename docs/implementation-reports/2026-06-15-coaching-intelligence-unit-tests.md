# Implementation Report: Coaching Intelligence Unit Tests

Date/time: 2026-06-15 KST
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`
Branch/head: `main` / local working tree
Owner/agent: Codex

## 1. Status

Done for Prompt 2.

## 2. Objective

Add focused unit coverage for the deterministic Coaching Intelligence Layer v1 pure module before Today UI integration.

## 3. Starting point / handoff used

Used `docs/coaching-intelligence-layer-v1-task-plan.md`, `docs/coaching-intelligence-layer-v1-agent-prompts.md`, and the Prompt 1 pure module closeout.

## 4. Files changed

- `lib/coaching/__tests__/predictions.test.ts`: prediction fallback, diagnostic prediction, mini-mock priority, confidence, and clamping.
- `lib/coaching/__tests__/bottlenecks.test.ts`: no-evidence behavior, ranking, cap at 3, score-loss bands, and incomplete signal evidence.
- `lib/coaching/__tests__/next-action.test.ts`: diagnostic-first, required-repair priority, largest-bottleneck priority, and action shape.
- `lib/coaching/__tests__/trend.test.ts`: no fake trend history and chronological real points.
- `lib/coaching/__tests__/weekly-report.test.ts`: insufficient-data empty state and weekly improvement calculation.
- `lib/coaching/__tests__/profile.test.ts`: deterministic empty profile and combined profile output.
- `vitest.config.ts`: included `lib/**/__tests__/**/*.test.ts` so requested module tests run in the normal suite.
- `lib/coaching/predictions.ts`: fixed mini-mock prediction priority to use submitted mock evidence as the section-score source.
- `lib/coaching/bottlenecks.ts`: tightened weak-score severity so sections with no practice evidence do not crowd out sections with real practice signals.

## 5. What shipped

No learner-facing UI shipped yet. The coaching pure module is now covered by focused tests and two small logic fixes discovered by those tests.

## 6. What was verified

Commands run with:

```bash
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
```

- `vitest run lib/coaching --pool=threads` -> PASS, 6 files / 19 tests.
- `tsc --noEmit` -> PASS.

## 7. What remains unverified

- Today screen UI integration is not implemented.
- Browser/manual QA was not run because this phase has no UI surface.
- Full gate (`vitest run --pool=threads`, `eslint .`, `next build --webpack`) was not run in this focused Prompt 2 slice.

## 8. Beta/onboarding decision

No change. External beta remains blocked until signed-in production sync, backup/reset/import restore, and support email send/receive are verified.

## 9. Risks / rollback notes

The test suite now includes `lib/**/__tests__/**/*.test.ts`; this is intentional so colocated module tests run with the normal Vitest configuration.

## 10. Next smallest useful step

Run Prompt 3: integrate the tested coaching profile into the Today screen with polished cards and a Start button that opens real existing app tasks.
