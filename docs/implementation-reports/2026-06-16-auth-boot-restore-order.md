# Implementation Report: Auth Boot Restore Order

Date/time: 2026-06-16 01:25 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` after auth boot restore-order fix; Vercel production `dpl_FoV4GAKYKjm3zDTJLaG2nuvYc7sN`  
Owner/agent: Codex

## 1. Status

Done, deployed to Vercel production, and verified with automated tests plus clean-browser production smoke.

## 2. Objective

Fix the targeted boot/login/logout behavior without rebuilding auth, onboarding, routing, storage, UI, or progress architecture:

- logged-out root opens login first;
- authenticated sessions wait for saved progress before showing personalized app state;
- logout returns to login;
- default `Learner` state is not silently shown as restored progress.

## 3. Starting point / handoff used

User report: opening the site did not start on login when no user was clearly authenticated, and login/logout/login still showed default `Learner` instead of saved profile/progress. The prior signed-in restore key fix was already deployed, so this phase focused on client boot/auth/progress-load order.

## 4. Files changed

- `components/coach-app.tsx`: redirects unauthenticated root sessions to `/sign-in`, changes explicit logout to Clerk `redirectUrl: '/sign-in'`, marks authenticated restore as `Syncing`, shows `Restoring progress` instead of `Learner` while cloud progress is loading, and blocks personalized content until authenticated restore completes.
- `tests/recovery-boundary.test.ts`: adds source-level regression checks for signed-out root routing and restore-loading behavior.

## 5. What shipped

A clean logged-out browser opening `https://score120coach.com/` now lands on `https://score120coach.com/sign-in`. During authenticated restore, the app shows a restore/loading state rather than the default profile. Explicit logout returns to `/sign-in`.

## 6. What was verified

- `vitest run tests/recovery-boundary.test.ts tests/signed-in-restore-render.test.ts tests/signed-in-blank-cloud-guard.test.ts tests/sync-ownership.test.ts --pool=threads` -> 4 files / 13 tests passed.
- `tsc --noEmit` -> PASS.
- Focused ESLint on changed files -> PASS.
- `vitest run --pool=threads` -> 38 files / 165 tests passed.
- `next build --webpack` -> PASS.
- `npx vercel --prod --yes` -> production deployment `dpl_FoV4GAKYKjm3zDTJLaG2nuvYc7sN` ready and aliased to `https://score120coach.com`.
- `https://score120coach.com/api/readiness` -> `ready:true`.
- Production routes `/`, `/sign-in`, `/sign-up`, `/support`, `/privacy`, `/terms`, `/beta`, `/korea` -> HTTP 200.
- Clean production Chromium opening `/` ended at `/sign-in`, showed Clerk email/password fields, and did not show the default `Learner` profile setup app state.
- Live app chunk contains the restore-loading copy `Loading your saved TOEFL path.`

## 7. What remains unverified

- Real production login with the affected account.
- Saved name/progress/XP/streak/next drill visibly reappearing after login.
- Logout then login again with the same affected account.
- Same-account/different-account browser matrix.
- Backup/reset/import and support email checks.

## 8. Beta/onboarding decision

No change. External beta remains blocked until the real affected-account restore and remaining manual smoke checks pass.

## 9. Risks / rollback notes

This is intentionally narrow client behavior. It preserves the existing Clerk routes, Convex sync model, local guest mode, data model, onboarding, and progress logic. Rollback would restore the previous signed-out root prompt behavior, but that would violate the current login-first acceptance requirement.

## 10. Next smallest useful step

Use the affected production account: open `/`, confirm login appears, log in, and confirm the saved learner name/progress appears before doing any new work.
