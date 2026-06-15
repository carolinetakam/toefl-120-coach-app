# Implementation Report: Auth Entry Routes

Date/time: 2026-06-15 23:08 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` / `ea28e71`, `728c13b`, then fallback patch
Owner/agent: Codex

## 1. Status

Done, pushed, deployed to production, and production auth-entry pages smoke-tested without credentials. A second fallback patch adds modal-login links for users whose browser fails to load the full-page Clerk surface. Real-account login remains unverified.

## 2. Objective

Reduce login friction after the user reported they could not log into the app.

## 3. Starting point / handoff used

Used:

- `docs/PROJECT_STATUS.md`
- `docs/NEXT_PHASE_HANDOFF.md`
- `docs/implementation-reports/2026-06-15-logout-guest-auth-state-fix.md`
- `docs/PHASE_CLOSEOUT_PROCESS.md`
- current `components/coach-app.tsx`

## 4. Files changed

- `components/coach-app.tsx`: changed `Log In` and `Create Account` actions from Clerk modal calls to full-page `/sign-in` and `/sign-up` navigation.
- `components/coach-app.tsx`: added `/?auth=sign-in` and `/?auth=sign-up` fallback handling to open the Clerk modal from the home page.
- `app/sign-in/[[...sign-in]]/page.tsx`: added a dedicated Clerk sign-in page with redirect back to `/`.
- `app/sign-up/[[...sign-up]]/page.tsx`: added a dedicated Clerk sign-up page with redirect back to `/`.
- `app/sign-in/[[...sign-in]]/page.tsx`: added a visible fallback link to open the login popup.
- `app/sign-up/[[...sign-up]]/page.tsx`: added a visible fallback link to open the account popup.
- `app/globals.css`: added responsive auth-page layout styles.

## 5. What shipped

The app now has durable auth entry URLs:

- `/sign-in`
- `/sign-up`
- `/?auth=sign-in`
- `/?auth=sign-up`

Signed-out app buttons route to the full pages instead of relying only on an overlay modal. The full pages also provide fallback links back to the original modal flow, so users have two auth entry paths if one browser surface fails.

## 6. What was verified

Automated/local checks:

- `tsc --noEmit` -> PASS.
- `eslint components/coach-app.tsx 'app/sign-in/[[...sign-in]]/page.tsx' 'app/sign-up/[[...sign-up]]/page.tsx'` -> PASS.
- `eslint .` -> PASS.
- `vitest run tests/sync-ownership.test.ts --pool=threads` -> PASS, 1 file / 4 tests.
- `next build --webpack` -> PASS and generated dynamic routes for `/sign-in/[[...sign-in]]` and `/sign-up/[[...sign-up]]`.

Browser checks:

- Production pre-fix smoke at `https://score120coach.com` confirmed the existing Clerk modal opened and Clerk assets returned HTTP 200 without entering credentials.
- Local production server `next start --port 3002` verified the signed-out `Log In` button navigated to `/sign-in`.
- Local production server verified `/sign-in` and `/sign-up` route copy rendered.
- `git push origin main` -> pushed `ea28e71`.
- Production polling showed `/sign-in` changed from 404 to HTTP 200 after deploy.
- `curl` production route smoke -> HTTP 200 for `/`, `/sign-in`, `/sign-up`, `/beta`, `/support`, `/privacy`, `/terms`, and `/korea`.
- `https://score120coach.com/api/readiness` -> `ready:true` and `manualReviewRequired:true`.
- Production Chromium smoke verified the live `Log In` button routes to `/sign-in`, `/sign-in` renders Clerk email/password fields, `/sign-up` renders Clerk account creation fields, and no console errors or HTTP 4xx/5xx responses appeared.
- After the user reported "the page could not be loaded", local fallback patch verification ran:
  - `tsc --noEmit` -> PASS.
  - focused `eslint` on auth files and `components/coach-app.tsx` -> PASS.
  - `next build --webpack` -> PASS.
  - local `/?auth=sign-in` smoke confirmed the fallback path triggers the sign-in surface and `/sign-in` shows the fallback link. Clerk returned the known localhost-only HTTP 400 under live production keys.

Local limitation:

- Local Clerk form fields did not render under the live production Clerk key because Clerk returned HTTP 400 for `localhost`, matching the known local-auth-provider limitation. Production-domain form rendering was verified after deploy.

## 7. What remains unverified

- Real production login with Caroline's actual account.
- Signed-in Convex restore after login.
- Backup/reset/import restore and support email checks.

## 8. Beta/onboarding decision

**BETA BLOCKED**

This reduces login-entry risk and verifies the production auth pages render, but does not clear external beta. A real production account must still sign in, restore/sync progress, and pass the existing backup/support smoke gates.

## 9. Risks / rollback notes

- Rollback is low risk: revert the two new route folders, the `router.push` changes in `components/coach-app.tsx`, and the auth-page CSS.
- The app no longer opens Clerk login as an overlay from the main workspace; it uses full-page auth routes.

## 10. Next smallest useful step

Complete one real-account login at `https://score120coach.com/sign-in` and verify the app returns to `/` as signed in with `Save Synced`.

If the full-page auth still shows "page could not be loaded", use `https://score120coach.com/?auth=sign-in` to open the modal login fallback and capture the exact browser/device if both paths fail.
