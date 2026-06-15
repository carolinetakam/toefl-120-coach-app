# Implementation Report: Backup Import Access Fix

Date/time: 2026-06-15 14:18 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` / local changes after `dd565c9`  
Owner/agent: Codex

## 1. Status

Done locally. Not deployed in this phase.

## 2. Objective

Fix the restore-flow blocker where reset works, but the user must redo the diagnostic before they can access the import button.

## 3. Starting point / handoff used

Used:

- User report: reset works, but import button is inaccessible until diagnostic is redone.
- `components/coach-app.tsx`
- `docs/PROJECT_STATUS.md`
- `docs/NEXT_PHASE_HANDOFF.md`

## 4. Files changed

- `components/coach-app.tsx`
  - Added `Import backup` to the existing always-visible sidebar `Progress controls`.
  - Moved the hidden file input out of the diagnostic-gated Progress tab so file import remains available after reset and before diagnostic completion.
  - Kept the existing Progress-tab import/reset/paste controls unchanged for post-diagnostic use.

## 5. What shipped

After reset, a signed-in or guest user can access `Import backup` from the sidebar without redoing onboarding or diagnostic first.

## 6. What was verified

Automated checks:

- `tsc --noEmit` -> PASS.
- `eslint components/coach-app.tsx` -> PASS.
- `vitest run tests/sync-ownership.test.ts --pool=threads` -> PASS, 4 tests.
- `vitest run` -> PASS, 25 files / 121 tests.
- `eslint .` -> PASS.
- `next build --webpack` -> PASS.

User-reported evidence:

- Reset works.
- Import access was blocked by UI placement after reset.

## 7. What remains unverified

- Production deployment of this import-access fix.
- Actual post-reset import restore using `/Users/carolinetakam/Downloads/toefl-120-coach-backup-2026-06-15.json`.
- Confirm restored profile, diagnostic, XP/streak, review queue, mini mock, and speaking attempt return.

## 8. Beta/onboarding decision

**BETA BLOCKED**

Backup export and reset have partial positive evidence, but full reset/import restore is not proven until the import-access fix is deployed and the backup is restored successfully.

## 9. Risks / rollback notes

- This is a UI placement fix only.
- It does not change backup parsing, import validation, or cloud sync semantics.
- The import file picker remains unavailable to fully signed-out users until they log in or explicitly continue as guest.

## 10. Next smallest useful step

Deploy this fix, then:

1. Reset progress.
2. Use sidebar `Progress controls -> Import backup`.
3. Select `/Users/carolinetakam/Downloads/toefl-120-coach-backup-2026-06-15.json`.
4. Confirm diagnostic, profile, XP/streak, review, mini mock, and speaking attempt restore without redoing diagnostic.
