# Implementation Report: Auth Entry Routes

Date/time: 2026-06-15 23:08 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` / local changes after `0f57406`  
Owner/agent: Codex

## 1. Status

Done locally. Pending push/deployment and live account retest at the time of this report.

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
- `app/sign-in/[[...sign-in]]/page.tsx`: added a dedicated Clerk sign-in page with redirect back to `/`.
- `app/sign-up/[[...sign-up]]/page.tsx`: added a dedicated Clerk sign-up page with redirect back to `/`.
- `app/globals.css`: added responsive auth-page layout styles.

## 5. What shipped

The app now has durable auth entry URLs:

- `/sign-in`
- `/sign-up`

Signed-out app buttons route to those pages instead of relying only on an overlay modal. This should be more reliable for mobile browsers, strict browser settings, and users who need a shareable login URL.

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

Local limitation:

- Local Clerk form fields did not render under the live production Clerk key because Clerk returned HTTP 400 for `localhost`, matching the known local-auth-provider limitation. Production-domain verification remains required after deploy.

## 7. What remains unverified

- Real production login with Caroline's actual account.
- Production `/sign-in` and `/sign-up` pages after Vercel deploy.
- Signed-in Convex restore after login.
- Backup/reset/import restore and support email checks.

## 8. Beta/onboarding decision

**BETA BLOCKED**

This reduces login-entry risk but does not clear external beta. A real production account must still sign in, restore/sync progress, and pass the existing backup/support smoke gates.

## 9. Risks / rollback notes

- Rollback is low risk: revert the two new route folders, the `router.push` changes in `components/coach-app.tsx`, and the auth-page CSS.
- The app no longer opens Clerk login as an overlay from the main workspace; it uses full-page auth routes.

## 10. Next smallest useful step

Push/deploy this patch, then open `https://score120coach.com/sign-in` and confirm the email/password sign-in form renders on the production domain. After that, complete one real-account login and verify the app returns to `/` as signed in.
