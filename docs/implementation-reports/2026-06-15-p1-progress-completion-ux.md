# Implementation Report: P1 Progress Completion UX

Date/time: 2026-06-15 15:34 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` / local changes after `21d23ae`  
Owner/agent: Codex

## 1. Status

Done locally. Not deployed in this phase.

## 2. Objective

Complete the remaining Priority 1 non-structural UX work: separate save/draft from completion, clarify required repair blocking, make missing required work actionable, and show a next-step prompt after submitted work.

## 3. Starting point / handoff used

Used:

- `docs/PROJECT_STATUS.md`
- `docs/NEXT_PHASE_HANDOFF.md`
- `docs/implementation-reports/2026-06-15-recording-context-ux-fix.md`
- `docs/implementation-reports/2026-06-15-microphone-blocked-fallback.md`
- `docs/implementation-reports/2026-06-15-recording-playback-mime-fix.md`
- `docs/architecture/TOEFL_Coach_Architecture/APP_AUDIT.md`

## 4. Files changed

- `lib/progression.ts`
  - Added missing required action modeling for path days.
  - Day completion now requires all required actions for that day, not just the first action.
  - Locked day reasons now name the number of incomplete required repairs and the blocking day.
  - Mini mock proof access now checks first required repair-day completion before allowing proof.
- `components/coach-app.tsx`
  - Added a post-submit `NextStepPrompt`.
  - Added clickable missing required repair links in Path locked cards.
  - Added a Progress “Required completion” panel with clickable missing repairs.
  - Made Evidence Snapshot sections and Recent Practice entries clickable into existing Library views.
  - Updated completion wording from saved evidence to submitted evidence.
- `tests/progression.test.ts`
  - Updated progression tests to require all required day actions before a day completes.

## 5. What shipped

- Draft/autosave no longer behaves like day completion in the path model.
- A path day is complete only when all required actions have submitted evidence.
- Locked days explain exactly what required work is missing.
- Missing required repairs are clickable from Path and Progress.
- After submitting practice, writing, speaking, or mini mock work, the learner sees a next-step panel with a Continue button.

## 6. What was verified

Automated checks:

- `tsc --noEmit` -> PASS.
- `eslint .` -> PASS.
- `vitest run tests/progression.test.ts tests/repair-path.test.ts tests/proof-loop-smoke.test.ts tests/first-user-loop.test.ts --pool=threads` -> PASS, 4 files / 26 tests.
- `vitest run` -> PASS, 25 files / 124 tests.
- `next build --webpack` -> PASS, compiled successfully and generated 9 static pages.

Browser verification:

- Used bundled Playwright against local production server `next start -p 3004`.
- Desktop `1440x1000`: after guest onboarding/diagnostic, Path showed locked-day required repair reason, clickable missing Day 1 speaking action, Progress missing required repair panel, clickable progress action, and no horizontal overflow.
- Mobile `390x844`: same checks passed with no horizontal overflow.

## 7. What remains unverified

- This change has not been deployed to production.
- Production signed-in sync, backup/reset/import restore, and support email checks remain outside this phase.

## 8. Beta/onboarding decision

**BETA BLOCKED**

P1 local UX is now complete, but external beta remains blocked until production smoke checks pass.

## 9. Risks / rollback notes

- The stricter completion model may make the path feel more demanding because all required day actions must be submitted before the next day completes.
- Rollback would be limited to `lib/progression.ts`, `components/coach-app.tsx`, and `tests/progression.test.ts`.

## 10. Next smallest useful step

Commit and push this P1 completion change, wait for deployment, then retest Path and Progress on production with a real account.
