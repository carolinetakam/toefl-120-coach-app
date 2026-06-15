# Implementation Report: Signed-In Progress Restore Key

Date/time: 2026-06-16 01:16 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` after signed-in progress restore key fix; Convex deployed to `https://brainy-chicken-240.convex.cloud`; Vercel production `dpl_23ddCsEKynt7SYfk5RKne43NbSCL`  
Owner/agent: Codex

## 1. Status

Done, deployed to Convex production and Vercel production, with automated restore/blank-overwrite regression coverage.

## 2. Objective

Fix the targeted bug where logout/login can return a signed-in `Cloud sync` / `Save Synced` workspace showing the default `Learner` profile instead of existing saved progress. Do not rebuild auth, onboarding, routing, storage, or progress logic.

## 3. Starting point / handoff used

User screenshot showed an authenticated cloud workspace with `Learner`, onboarding/profile setup, XP 0, and `Save Synced`. The likely failure area was the successful-login progress restore branch choosing the wrong saved source/user key or treating a blank restore as synced.

## 4. Files changed

- `convex/schema.ts`: adds `users.subject`, `users.by_subject`, and `users.by_email` so the existing Convex user can be found if Clerk token identifier changes across auth sessions.
- `convex/coach.ts`: makes `getUserId` and `requireUser` look up the user by token identifier first, then subject, then email; when a fallback match is found, it patches the current token identifier onto that same user instead of creating a separate blank user.
- `components/coach-app.tsx`: prevents an empty cloud restore plus empty local state from being marked `Synced` and autosaved over cloud as the default `Learner` profile. New-account saving resumes once the learner creates real progress.
- `tests/signed-in-blank-cloud-guard.test.ts`: adds jsdom regression coverage that a signed-in empty cloud restore does not call `saveAppState` with blank progress.
- `tests/recovery-boundary.test.ts`: adds source-level coverage for the blank-overwrite guard.

## 5. What shipped

After login, the Convex restore path is more tolerant of Clerk identity-key drift and should find the existing saved app state for the same account email/subject. If no cloud snapshot is found and local progress is empty, the app shows `Save Offline` and does not upload the blank `Learner` profile over cloud progress.

## 6. What was verified

- `vitest run tests/signed-in-blank-cloud-guard.test.ts tests/signed-in-restore-render.test.ts tests/recovery-boundary.test.ts tests/sync-ownership.test.ts --pool=threads` -> 4 files / 11 tests passed.
- `tsc --noEmit` -> PASS.
- Focused ESLint on changed app/Convex/test files -> PASS.
- `vitest run --pool=threads` -> 38 files / 163 tests passed.
- `next build --webpack` -> PASS.
- `convex deploy --env-file /tmp/toefl-convex-prod.env --message "fix auth restore user lookup"` -> deployed to `https://brainy-chicken-240.convex.cloud`; schema validation complete; added `users.by_email` and `users.by_subject` indexes.
- `npx vercel --prod --yes` -> deployment `dpl_23ddCsEKynt7SYfk5RKne43NbSCL` ready and aliased to `https://score120coach.com`.
- `https://score120coach.com/api/readiness` -> `ready:true`.
- Production route smoke -> `/`, `/sign-in`, `/sign-up`, `/support`, `/privacy`, `/terms`, `/beta`, `/korea` all returned HTTP 200.
- Live root app chunk contains `No saved cloud progress was found...` and `Blank profile was not synced...`, confirming the frontend guard is deployed.

## 7. What remains unverified

- Real production logout/login with the affected account.
- Existing progress visibly reappearing after login in Caroline's browser.
- Sidebar showing `Cloud sync` with `Save Synced` after a restored nonblank cloud snapshot.
- Same-account/different-account browser matrix.
- Backup/reset/import and support email checks.

## 8. Beta/onboarding decision

No change. This removes a likely cause of blank post-login state and protects against blank overwrites, but external beta remains blocked until real-account signed-in restore, backup/import restore, and support email checks pass.

## 9. Risks / rollback notes

The backend lookup now allows email fallback inside the existing Clerk-authenticated Convex account path. This is intended for a small beta where account email is the stable user-facing key. Rollback would remove `subject`/email fallback lookup and the client blank-overwrite guard, but that would reintroduce the reported failure mode.

## 10. Next smallest useful step

In the same affected production browser, log out and log back in with the same account. If progress still does not appear, capture whether the sidebar says `Save Offline` or `Save Synced`; that distinction now tells whether Convex found a nonblank snapshot.
