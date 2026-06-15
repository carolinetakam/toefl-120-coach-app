# Implementation Report: Production Sync Validator Fix

Date/time: 2026-06-15 13:10 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` / local changes after `5be3ea0`  
Owner/agent: Codex

## 1. Status

Reduced-scope shipped to Convex production.

The exact production sync failure was identified and the smallest backend fix was deployed. External beta remains blocked until the real browser/account matrix is rerun.

## 2. Objective

Verify and harden authenticated Clerk to Convex progress synchronization so signed-in learner progress can survive refresh, browser changes, device changes, and account switching without leaking data between users.

## 3. Starting point / handoff used

Used:

- `docs/PROJECT_STATUS.md`
- `docs/NEXT_PHASE_HANDOFF.md`
- `docs/LIVE_SYNC_SMOKE_HANDOFF.md`
- `docs/PHASE_CLOSEOUT_PROCESS.md`
- `docs/implementation-reports/2026-06-15-production-sync-smoke-failure-patch.md`
- `components/coach-app.tsx`
- `convex/coach.ts`
- `convex/appState.ts`
- `convex/schema.ts`
- `lib/sync-ownership.ts`

## 4. Files changed

- `components/coach-app.tsx`
  - Added temporary production-safe auth, cloud restore, and cloud save console logs.
- `convex/coach.ts`
  - Added temporary backend logs for auth identity path, restore result, save start, and save success.
  - Logs confirm both save and restore use `identity.tokenIdentifier`; they do not dump learner snapshots.

No product redesign or broad refactor was made.

## 5. What shipped

- Convex production deployment `brainy-chicken-240` was updated with the current backend schema/validator.
- The deployed Convex validator now accepts the app state fields that production was rejecting:
  - `state.diagnosticFormId`
  - `state.speakingAttempts[].hasAudioEvidence`
  - `state.miniMockAttempts`

## 6. What was verified

Root-cause evidence from production Convex logs before the fix:

- `coach:saveAppState` was called in production.
- Mutation failed with `ArgumentValidationError`.
- First failure: extra field `diagnosticFormId` at `.state`.
- Later failures: extra field `hasAudioEvidence` at `.state.speakingAttempts[0]`.
- Result: no `users` or `appStates` documents were created for the real smoke path, so a second browser had no cloud state to restore.

Production data inspection before the fix:

- `users: 0`
- `appStates: 0`
- `duplicateAppStateUsers: 0`
- `orphanedAppStates: 0`

Convex production deploy:

- `convex deploy --env-file /tmp/toefl-convex-prod.env --message "fix app state validator for production sync"` -> deployed successfully to `https://brainy-chicken-240.convex.cloud`.
- Deployment added current `miniMockAttempts` indexes and completed schema validation.

Backend-only post-fix smoke with a synthetic identity:

- `coach:saveAppState` accepted a state containing `diagnosticFormId`, `speakingAttempts[].hasAudioEvidence`, and `miniMockAttempts`.
- `coach:getAppState` returned the same saved state for the same identity.
- `coach:deleteMyData` removed the synthetic app snapshot.
- Follow-up production aggregate: `appStates: 0`; one synthetic user shell remains, with no app snapshot.

Local verification:

- `vitest run tests/sync-ownership.test.ts --pool=threads` -> 1 file / 4 tests passed.
- `tsc --noEmit` -> passed.
- `eslint components/coach-app.tsx convex/coach.ts` -> passed.
- `vitest run` -> 25 files / 121 tests passed.
- `next build --webpack` -> compiled successfully and generated 9 static pages.

## 7. What remains unverified

The full required live browser matrix was not completed in this agent session because no real Clerk test account session/credentials were available inside the browser:

- Chrome same-account onboarding and diagnostic.
- Chrome refresh restore.
- Incognito same-account restore.
- Safari same-account restore.
- Different-account isolation.
- Sign out and sign back in restore.

Frontend temporary logs are present locally and should be deployed with the next frontend push so the live browser retest captures:

- `AUTH_STATE`
- `CLOUD_RESTORE_START`
- `CLOUD_RESTORE_RESULT`
- `CLOUD_SAVE_START`
- `CLOUD_SAVE_SUCCESS`
- `CLOUD_SAVE_FAILED`

## 8. Beta/onboarding decision

**BETA BLOCKED**

The root backend validator failure is fixed in Convex production, but the specification requires real cross-browser and account-isolation evidence before beta users can safely use the platform.

## 9. Risks / rollback notes

- The previous user smoke data never reached Convex because mutation validation failed. Same-browser refresh worked from localStorage only.
- The backend uses `identity.tokenIdentifier` consistently for both save and restore.
- `getAppState` queries only the current internal user id and returns a single `appStates` document via `by_userId`.
- `saveAppState` patches or inserts one `appStates` document for the current user.
- Temporary logs should be removed after the production browser matrix passes.

## 10. Next smallest useful step

Deploy the frontend instrumentation, then rerun the exact production browser matrix:

1. User A normal Chrome: sign in, complete onboarding, complete diagnostic, wait for `Save Synced`.
2. Refresh Chrome: confirm progress remains.
3. User A incognito: sign in, confirm progress restores and onboarding is skipped.
4. User A Safari: sign in, confirm progress restores.
5. User B: sign in, confirm no User A data is visible.
6. User A sign out and sign back in: confirm progress restores.

If all pass, update `docs/PROJECT_STATUS.md`, `docs/NEXT_PHASE_HANDOFF.md`, and create a production sync pass report.
