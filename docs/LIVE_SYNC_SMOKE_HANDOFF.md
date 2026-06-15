# Live Signed-In Sync Smoke Handoff

Last updated: 2026-06-15 13:10 KST
Project: TOEFL 120 Coach  
Repo: `/Users/carolinetakam/Documents/apps/toefl-120-coach-app-only`  
Production URL: `https://score120coach.com`  
Current reviewed commit: `126978b fix: add account switch and sync ownership guard`

## Executive status

**Status: backend root cause fixed / browser retest required.**

Caroline ran the live signed-in production sync smoke and found a real beta blocker:

1. Progress **survived refresh** in the same normal browser.
2. In a private browser, signing in again showed **no saved progress** and forced onboarding/diagnostic restart.
3. In another browser, the app stayed signed into a previous test account.
4. There was **no obvious logout/account-switch control** for Caroline to switch accounts cleanly.

A local patch was implemented and pushed to `main` at commit `126978b`. The patch improves account switching and prevents cross-account local-progress contamination.

On the follow-up verification pass, production Convex logs showed the exact save failure: `coach:saveAppState` was called but rejected by argument validation because the deployed backend validator did not accept `state.diagnosticFormId` and then `state.speakingAttempts[].hasAudioEvidence`. Convex production was redeployed with the current validator, and a backend-only synthetic save/restore shape check passed. The signed-in production sync gate is **not passed** until the deployed site is retested in real browsers.

## Beta decision

**Do not invite external beta users yet.**

This still blocks beta because a learner must be able to:

- sign in;
- complete profile/diagnostic/practice;
- return from another browser/session;
- see the same saved progress;
- switch accounts safely when needed.

Founder/internal smoke testing may continue.

## What changed in the patch

### Files changed

- `components/coach-app.tsx`
  - Adds visible **Sign out / switch** control in the sidebar.
  - Adds visible **Sign out / switch account** control during signed-in onboarding.
  - Uses Clerk `userId` in auth mode so account changes re-run sync initialization.
  - Clears local app progress on sign-out/account switch so a different account does not inherit stale browser progress.
  - Writes a local sync-owner marker after cloud save/restore.
  - Blocks a different signed-in account from promoting previous account local progress to cloud.

- `lib/sync-ownership.ts`
  - Adds ownership helpers:
    - `LOCAL_SYNC_OWNER_KEY`
    - `localStateBelongsToAnotherUser`
    - `canPromoteLocalStateToCloud`

- `tests/sync-ownership.test.ts`
  - Covers guest progress promotion.
  - Covers same-account promotion.
  - Covers cross-account block.
  - Covers empty local state behavior.

- Documentation created/updated:
  - `docs/PROJECT_STATUS.md`
  - `docs/NEXT_PHASE_HANDOFF.md`
  - `docs/PHASE_CLOSEOUT_PROCESS.md`
  - `docs/implementation-reports/2026-06-15-production-sync-smoke-failure-patch.md`
  - `docs/implementation-reports/2026-06-15-production-sync-validator-fix.md`

## Verified root cause and backend fix

Production Convex evidence before the fix:

- `coach:getAppState` ran.
- `coach:saveAppState` ran.
- Saves failed with `ArgumentValidationError`.
- Rejected fields included `state.diagnosticFormId` and `state.speakingAttempts[].hasAudioEvidence`.
- Production data inspection showed no persisted app snapshots.

Fix shipped:

- Deployed current Convex backend to `brainy-chicken-240`.
- Backend-only save/restore check passed with the previously rejected fields.
- Synthetic app snapshot was deleted after the check.

## Verification already completed locally

Commands used:

```bash
cd /Users/carolinetakam/Documents/apps/toefl-120-coach-app-only
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
```

Results:

- `vitest run tests/sync-ownership.test.ts --pool=threads` -> PASS, 4 tests.
- `tsc --noEmit` -> PASS.
- `vitest run` -> PASS, 25 test files / 121 tests.
- `eslint .` -> PASS.
- `next build --webpack` -> PASS.
- `git push origin main` -> pushed `126978b` to GitHub.
- `curl -fsS https://score120coach.com/api/readiness` -> `ready:true` after push.
- Public routes returned HTTP 200 after push:
  - `/`
  - `/beta`
  - `/support`
  - `/privacy`
  - `/terms`
  - `/korea`

## What remains unverified

The patch has **not** been proven by live browser retest yet.

Still unknown:

- whether Vercel has deployed commit `126978b` yet;
- whether same-account private-browser restore now works;
- whether Clerk/Convex auth saves and reads `appStates` in a real browser session after the backend validator deploy;
- whether `Save Synced` appears after profile/diagnostic completion;
- whether account switching now works in the browser that was stuck on the old test account.

## Required retest checklist

Use this exact sequence after deployment.

### A. Confirm new account-switch UI exists

1. Open `https://score120coach.com`.
2. If signed in, look in the sidebar under **Progress controls**.
3. Confirm visible button exists:

```text
Sign out / switch
```

If this button does not appear, the new production bundle may not be deployed yet.

### B. Same-account sync restore test

1. In a normal browser, click **Sign out / switch** if the wrong account is active.
2. Sign in with the intended test account.
3. Complete profile setup.
4. Complete diagnostic.
5. Wait for sidebar save chip to show:

```text
Save Synced
```

6. Hard refresh the page.
7. Confirm profile/diagnostic progress remains.
8. Open a private/incognito browser.
9. Sign in with the **same exact account**.
10. Confirm the same profile/diagnostic/progress appears.

### C. Different-account isolation test

1. In the browser that was stuck on the previous test account, click:

```text
Sign out / switch
```

2. Sign in with a different test account.
3. Confirm the app starts clean or shows only that account’s cloud progress.
4. Confirm it does **not** inherit the first account’s profile/diagnostic/progress.

## Pass criteria

Mark **signed-in production sync smoke = PASS** only if all are true:

- New **Sign out / switch** control is visible in production.
- Same account restores progress in private/incognito browser.
- Different account does not inherit the first account’s progress.
- Save chip reaches `Save Synced` after meaningful progress.
- No console/network errors appear around Clerk or Convex during save/restore.

## Fail criteria

Keep beta blocked if any are true:

- Private browser still restarts onboarding for the same account after `Save Synced` appeared in normal browser.
- Save chip says `Save Offline` after profile or diagnostic.
- App is stuck on the old account and cannot switch.
- A different account sees another account’s progress.
- The visible account-switch button is missing after deployment.

## If retest fails again

Next debugging target is no longer only UI/account switching. Investigate production Clerk/Convex sync directly.

### Evidence to capture

In browser DevTools:

1. Console errors after sign-in.
2. Console errors after profile save.
3. Console errors after diagnostic completion.
4. Network/WebSocket errors involving Convex.
5. Whether save status says:
   - `Save Synced`
   - `Save Syncing`
   - `Save Offline`
   - `Save Local`

### Code anchors for next debugging agent

- `components/coach-app.tsx`
  - auth/sync hooks near `useAuth`, `useQuery(api.coach.getAppState)`, `useMutation(api.coach.saveAppState)`
  - save/load effects around sync initialization
  - account switching handler `handleSignOut`

- `convex/coach.ts`
  - `getUserId`
  - `requireUser`
  - `getAppState`
  - `saveAppState`
  - `deleteMyData`

- `app/providers.tsx`
  - `ClerkProvider`
  - `ConvexProviderWithClerk`

- `lib/sync-ownership.ts`
  - local owner guard helpers

- `lib/storage.ts`
  - localStorage load/save/reset behavior

## Next smallest useful action

Wait for deployment, then rerun the live smoke checklist above. If it passes, update:

1. `docs/PROJECT_STATUS.md`
2. `docs/NEXT_PHASE_HANDOFF.md`
3. a new report under `docs/implementation-reports/YYYY-MM-DD-production-sync-smoke-pass.md`

If it fails, do not invite beta users. Capture the evidence listed above and fix the Clerk/Convex production sync path next.
