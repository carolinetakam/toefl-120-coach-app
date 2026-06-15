# Implementation Report: Post-Login Load Recovery

Date/time: 2026-06-15 23:50 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` local working tree after `ff475d6`  
Owner/agent: Codex

## 1. Status

Implemented locally, verified by automated gates and local production HTTP smoke. Pending push/deploy and real-account production retest.

## 2. Objective

Respond to the user report that the private browser can load the app, but after login the app says the page could not load.

## 3. Starting point / handoff used

Production `/sign-in` was already verified to return HTTP 200 and render Clerk email/password fields in a clean browser. The remaining likely failure point was after successful login, when the app shell starts signed-in Convex restore.

## 4. Files changed

- `components/coach-app.tsx`: added a signed-in cloud-restore recovery path if stored cloud state cannot be sanitized. The app now marks sync offline, keeps local practice available, and shows a retry/support banner instead of crashing.
- `app/error.tsx`: added a route-level recovery screen for client errors below the root layout.
- `app/global-error.tsx`: added a global recovery screen for errors that happen at the layout/provider level.
- `app/globals.css`: added small recovery banner/shell styles.

## 5. What changed for users

- If login succeeds but the workspace fails during restore, users should now see a recoverable TOEFL workspace or a clear recovery screen with `Retry`, `Back to app`, and `Support`.
- The app no longer relies on a raw crash/blank Next.js failure page for this class of signed-in restore error.
- This does not claim signed-in sync is fixed or beta-ready; it makes the failure safer and easier to diagnose.

## 6. What was verified

- `vitest run` -> PASS, 34 files / 152 tests.
- `tsc --noEmit` -> PASS.
- `eslint .` -> PASS.
- `next build --webpack` -> PASS.
- Local production HTTP smoke on `http://localhost:3000`:
  - `/` returned HTTP 200.
  - `/sign-in` returned HTTP 200.
  - `/sign-in` server HTML includes the non-loop recovery copy.
  - Built HTML includes the new route/global error chunks.

## 7. What remains unverified

- Real production login with valid credentials.
- Whether the user's exact post-login failure is caused by Convex auth/token setup, malformed stored state, or another signed-in app-shell exception.
- Production deployment smoke after push.

## 8. Beta/onboarding decision

No change. External beta remains blocked until real production auth/sync, backup/import restore, and support email checks pass.

## 9. Risks / rollback notes

The error boundary is intentionally generic and does not expose raw error details to users. If a provider-level error persists, the recovery screen should keep the app from showing an unexplained blank failure, but it will not by itself repair the underlying account sync path.

## 10. Next smallest useful step

Push to `main`, wait for Vercel deployment, then retest `https://score120coach.com/sign-in` with the affected private-browser account and record the exact URL/error if the recovery screen appears.
