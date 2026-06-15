# Implementation Report: Auth Redirect Loop Fix

Date/time: 2026-06-15 23:35 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` local working tree after `7160928`  
Owner/agent: Codex

## 1. Status

Done locally, pending production verification after push.

## 2. Objective

Fix the user-reported loop where `/sign-in` showed the auth page shell, redirected to the main page, then returned to the auth page again.

## 3. Starting point / handoff used

User screenshot showed the `/sign-in` page left-side copy rendering while the Clerk form area was blank. The page also contained a fallback link to `/?auth=sign-in`, and the app shell had a home-page effect that opened Clerk modal auth for `?auth=sign-in` / `?auth=sign-up`.

## 4. Files changed

- `app/sign-in/[[...sign-in]]/page.tsx`: removed the popup fallback link and replaced it with non-loop recovery links.
- `app/sign-up/[[...sign-up]]/page.tsx`: same non-loop recovery treatment.
- `components/coach-app.tsx`: removed the `?auth=sign-in` / `?auth=sign-up` modal-opening effect.
- `app/globals.css`: added recovery panel styling.

## 5. What shipped

- `/sign-in` no longer points users back to `/?auth=sign-in`.
- `/sign-up` no longer points users back to `/?auth=sign-up`.
- Visiting an old `/?auth=sign-in` URL no longer opens Clerk modal auth or creates a route bounce.
- Auth pages now show recovery copy with stable links to create/login/continue as guest.

## 6. What was verified

- `vitest run tests/env.test.ts tests/readiness-route.test.ts --pool=threads` -> PASS, 2 files / 4 tests.
- `next build --webpack` -> PASS.
- `tsc --noEmit` -> PASS after build regenerated `.next/types`.
- `eslint components/coach-app.tsx 'app/sign-in/[[...sign-in]]/page.tsx' 'app/sign-up/[[...sign-up]]/page.tsx'` -> PASS.
- Local production smoke on `http://localhost:3002`:
  - `/sign-in` no longer contains `open the login popup`;
  - `/sign-in` shows `If the form stays blank`;
  - `/?auth=sign-in` stays on home and does not open modal auth.

## 7. What remains unverified

- Production deploy and production loop retest.
- Real-account login with valid credentials.
- Signed-in Convex sync restore.

## 8. Beta/onboarding decision

No change. External beta remains blocked until real production auth/sync, backup/import, and support email checks pass.

## 9. Risks / rollback notes

This removes a fallback path that was intended to help if the dedicated auth page failed. It was causing a loop for the user, so the safer behavior is to keep auth entry on dedicated routes and provide a guest escape.

## 10. Next smallest useful step

After deploy, open `https://score120coach.com/sign-in` in the affected browser and confirm it no longer bounces between the sign-in page and home.
