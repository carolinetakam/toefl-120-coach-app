# Implementation Report: Microphone Blocked Fallback

Date/time: 2026-06-15 14:37 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` / local changes after recording context UX fix  
Owner/agent: Codex

## 1. Status

Done locally. Not deployed in this phase.

## 2. Objective

Improve the blocked microphone state so learners understand that recording is unavailable, can keep practicing in Self-Rating Mode, can open microphone help, and can return to the current exercise prompt without losing context.

## 3. Starting point / handoff used

Used the user addendum “Microphone Blocked Fallback” and the existing local recorder/context implementation from `docs/implementation-reports/2026-06-15-recording-context-ux-fix.md`.

## 4. Files changed

- `components/coach-app.tsx`
  - Replaced the denied microphone message with fallback-oriented copy.
  - Added `Use Self-Rating Mode`, `Enable Microphone`, and `Back to Exercise` actions in the existing blocked-state panel.
  - Kept task context in place and added refs so fallback actions scroll to the same prompt/self-rating controls instead of navigating away.

## 5. What shipped

- Blocked microphone state now says: `Microphone access is blocked. You can still practice using Self-Rating Mode, or enable microphone access to record your answer.`
- `Use Self-Rating Mode` keeps the learner in the same task and moves focus back to the self-rating workflow.
- `Enable Microphone` opens inline microphone help.
- `Back to Exercise` returns to the current task prompt/context panel.

## 6. What was verified

- `tsc --noEmit` -> PASS.
- `eslint components/coach-app.tsx` -> PASS.
- `vitest run tests/storage.test.ts tests/proof-loop-smoke.test.ts --pool=threads` -> PASS, 2 files / 7 tests.

## 7. What remains unverified

- Real browser microphone permission prompt/denied behavior was not manually clicked in this phase.
- Real audio capture was not verified with a physical microphone.
- This change has not been deployed to production.

## 8. Beta/onboarding decision

**BETA BLOCKED**

This improves fallback UX but does not clear the existing production smoke blockers.

## 9. Risks / rollback notes

- The fallback actions are UI-only and preserve current local task state.
- Audio remains local/browser-only; persistent state still stores audio evidence, not durable audio.

## 10. Next smallest useful step

Verify the denied microphone branch manually in Chrome and Safari after deployment by blocking microphone access, opening a speaking task, and confirming all three fallback actions preserve prompt/note/task context.
