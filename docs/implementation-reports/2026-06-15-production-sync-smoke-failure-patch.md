# Implementation Report: Production Sync Smoke Failure Patch

Date/time: 2026-06-15 11:58 KST  
Repo: `/Users/carolinetakam/Documents/apps/toefl-120-coach-app-only`  
Branch/head: `main` / pre-commit local changes  
Owner/agent: Ezra, coding review lane

## 1. Status

**Reduced-scope shipped locally.**

Caroline’s live smoke result means the signed-in production sync gate is **failed / not beta-cleared** until this patch is deployed and retested.

## 2. Objective

Respond to live production smoke findings:

- progress survived same-browser refresh;
- the same signed-in account did not restore progress in private browser;
- another browser stayed signed into an older test account;
- the app did not expose an obvious logout/account-switch path.

## 3. Starting point / handoff used

Used:

- `docs/PROJECT_STATUS.md`
- `docs/NEXT_PHASE_HANDOFF.md`
- `docs/PHASE_CLOSEOUT_PROCESS.md`
- `components/coach-app.tsx`
- `convex/coach.ts`
- `app/providers.tsx`
- `lib/storage.ts`

## 4. Files changed

- `components/coach-app.tsx`
  - Added explicit **Sign out / switch account** buttons beside Clerk’s user avatar.
  - Clears local app progress and local sync-owner marker on sign-out/account switch so another browser/account does not stay trapped in stale local state.
  - Tracks current Clerk user id in the auth mode so account changes re-run sync initialization.
  - Marks local browser progress with a sync owner after successful cloud save/restore.
  - Prevents one signed-in account from uploading/reusing another signed-in account’s local browser progress.
- `lib/sync-ownership.ts`
  - Added small ownership helpers for local-vs-cloud sync safety.
- `tests/sync-ownership.test.ts`
  - Added regression coverage for guest promotion, same-account promotion, cross-account block, and empty-state behavior.
- `docs/PROJECT_STATUS.md`
  - Recorded the failed live signed-in sync smoke result and retest requirement.

## 5. What shipped

Local code now has:

1. visible account switching instead of relying only on Clerk’s small avatar menu;
2. safer local state ownership so one account cannot silently inherit another account’s local progress;
3. regression tests for sync ownership decisions.

## 6. What was verified

Commands run with:

```bash
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
```

Results:

- `vitest run tests/sync-ownership.test.ts --pool=threads` -> PASS, 4 tests.
- `tsc --noEmit` -> PASS.
- `vitest run` -> PASS, 25 test files / 121 tests.
- `eslint .` -> PASS.
- `next build --webpack` -> PASS.

## 7. What remains unverified

- The patch has not yet been proven on deployed production in a real browser.
- It is still unknown whether the original private-browser no-progress issue was caused by:
  - cloud mutation failure;
  - Clerk/Convex token/auth issue;
  - older production bundle behavior;
  - account mismatch during testing;
  - or user progress only being local before the patch.

## 8. Beta/onboarding decision

**External beta remains blocked.**

Retest after deploy:

1. sign in with test account;
2. complete profile + diagnostic;
3. confirm Save status becomes `Synced`;
4. open private browser with same account;
5. confirm progress restores;
6. use **Sign out / switch account**;
7. sign into a different account;
8. confirm it does not inherit the first account’s progress.

## 9. Risks / rollback notes

- Sign-out now clears local browser progress copy, but does not delete cloud data. This is intentional for account privacy/account switching.
- If a user signs out before cloud save reaches `Synced`, recent local-only progress may be lost. The UI still exposes save status; beta testers should wait for `Save Synced` before switching accounts.
- If private-browser restore still fails after deployment, next root cause is likely Clerk/Convex auth/mutation behavior, not only local UI/account switching.

## 10. Next smallest useful step

Deploy this patch, then rerun the live signed-in sync smoke. If it still fails, capture browser console/network errors around Convex `getAppState` and `saveAppState`.
