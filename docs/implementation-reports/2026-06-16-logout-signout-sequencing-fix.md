# Implementation Report: Logout Signout Sequencing Fix

Date/time: 2026-06-16 02:28 KST
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`
Owner/agent: Codex

## 1. Status

Done locally. Automated gates pass. Not deployed in this phase.

## 2. Objective

Implement the smallest accepted diagnosis fix for:

`logout -> brief redirect -> return to authenticated app`

No auth redesign, provider change, route architecture change, or Convex data model change was made.

## 3. Files changed

- `components/coach-app.tsx`
- `tests/recovery-boundary.test.ts`

Related already-existing local auth wrapper/guest-routing changes remain in the working tree and were not reverted.

## 4. What changed

- `authState` no longer uses `signedOutLocally` to demote a still-signed-in Clerk session to `unauthenticated`.
- Custom logout now calls `await signOut()` before setting `signedOutLocally`, clearing local TOEFL state, or redirecting.
- The redirect to `/sign-in` happens after `signOut()` resolves and a short Clerk snapshot check confirms no active session remains.
- The unauthenticated root redirect still only runs when Clerk/app state is already `unauthenticated`.
- Removed Clerk `UserButton` logout surfaces from the app shell so the custom logout path is the single in-app logout path.
- Added temporary console tracing:
  - `AUTH_LOGOUT_BEFORE`
  - `AUTH_LOGOUT_AFTER_SIGNOUT_RESOLVED`
  - `AUTH_REDIRECT_BEFORE_SIGN_IN`
  - existing `AUTH_STATE` now includes `sessionId`.

## 5. Expected behavior

After deployment and real-account retest:

1. Login.
2. Click `Logout`.
3. Clerk `signOut()` resolves before the app enters local signed-out mode.
4. Browser lands on `/sign-in`.
5. Refresh remains on `/sign-in`.
6. Opening `/` while logged out redirects to `/sign-in`.
7. The app does not return to authenticated content unless Clerk reports a real signed-in session.

## 6. Verification

Commands run from `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only` with:

```bash
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
```

Results:

- `vitest run tests/recovery-boundary.test.ts tests/auth-entry-routes.test.ts tests/signed-in-restore-render.test.ts --pool=threads` -> interrupted after hanging with no output.
- `vitest run tests/recovery-boundary.test.ts tests/auth-entry-routes.test.ts tests/signed-in-restore-render.test.ts` -> 3 files / 14 tests passed.
- `eslint components/coach-app.tsx tests/recovery-boundary.test.ts` -> passed.
- `vitest run --pool=threads` -> 38 files / 168 tests passed.
- `tsc --noEmit` -> passed.
- `eslint .` -> passed.
- `next build --webpack` -> compiled successfully and generated 9 static pages.

## 7. Remaining verification

Production deployment and the founder-account browser acceptance path remain required:

- Login.
- Logout.
- Land on `/sign-in`.
- Refresh stays on `/sign-in`.
- Open `/`.
- Redirect to `/sign-in`.
- Confirm console traces show the Clerk session gone before redirect.

## 8. Risk / rollback

This is intentionally narrow. The main behavior change is sequencing: local app cleanup waits until Clerk signout resolves. If Clerk signout fails, the app should remain in the signed-in state instead of clearing local UI and racing to `/sign-in`.
