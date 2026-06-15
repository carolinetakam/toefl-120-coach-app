# Implementation Report: Auth Entry Link Hardening

Date/time: 2026-06-15 23:24 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` local working tree after `434dd0c`  
Owner/agent: Codex

## 1. Status

Done locally, pending production verification after push.

## 2. Objective

Fix the user-reported auth entry regression where the app page could load but `Log In` / `Create Account` actions did not reliably move forward.

## 3. Starting point / handoff used

User report after `434dd0c`: page load and login entry were unreliable even after fallback work by another agent.

## 4. Files changed

- `components/coach-app.tsx`: replaced JavaScript `router.push()` auth entry buttons with real `Link` anchors to `/sign-in` and `/sign-up` across signed-out, guest, and onboarding surfaces.

## 5. What shipped

- `Log In`, `Create Account`, and `Create beta account / Sign in` are now normal links.
- The critical auth entry path no longer depends on app-shell click handlers or client router state.

## 6. What was verified

- `vitest run tests/env.test.ts tests/readiness-route.test.ts --pool=threads` -> PASS, 2 files / 4 tests.
- `next build --webpack` -> PASS.
- `tsc --noEmit` -> PASS after build regenerated `.next/types`.
- `eslint components/coach-app.tsx 'app/sign-in/[[...sign-in]]/page.tsx' 'app/sign-up/[[...sign-up]]/page.tsx'` -> PASS.
- Local production smoke on `http://localhost:3002` verified `Log In` has `href="/sign-in"` and `Create Account` has `href="/sign-up"`.
- Production pre-fix smoke verified `https://score120coach.com/sign-in` loads Clerk and Clerk returns a normal `422` response for a fake unknown email, proving the widget can call Clerk on the production domain.

## 7. What remains unverified

- Real production login with a valid account/password.
- Signed-in Convex restore after successful login.
- Different-account isolation and backup/import production smoke.

## 8. Beta/onboarding decision

No change. External beta remains blocked until full production auth/sync, backup/import, and support email checks pass.

## 9. Risks / rollback notes

Rollback is low risk: restore the previous button handlers if anchor navigation causes an unexpected issue. Link navigation is more robust for auth entry because it still works when app-shell JavaScript handlers are unreliable.

## 10. Next smallest useful step

After push/deploy, open `https://score120coach.com`, click `Log In`, sign in with a real test account, and confirm the app returns to `/` with synced learner state.
