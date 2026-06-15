# Implementation Report: Clerk Callback Redirect Fix

Date/time: 2026-06-15 23:59 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` after `99e2b0b fix: preserve Clerk auth callback routing`  
Owner/agent: Codex

## 1. Status

Done, pushed, deployed, and production HTTP/static route smoke passed. Real-account production login remains unverified.

## 2. Objective

Fix the production login/post-login loading issue with the smallest safe change, without redesigning auth, changing Convex, rewriting the app shell, or touching TOEFL/sample-answer content.

## 3. Starting point / handoff used

The user reported that private-browser production loads, login starts, then after login the app says the page could not load or returns to auth/main unexpectedly.

Required context read first:

- `AGENTS.md`
- `docs/PROJECT_STATUS.md`
- `docs/NEXT_PHASE_HANDOFF.md`
- latest implementation reports, especially `2026-06-15-post-login-load-recovery.md` and `2026-06-15-auth-redirect-loop-fix.md`
- architecture route files: `README.md`, `FOLDER_SYSTEM_BLUEPRINT.md`, `APP_AUDIT.md`

Diff comparison showed the Model Answer & Compare Workflow/sample-answer commits did not change the Clerk/Convex provider path. The suspicious auth surface was the later dedicated `/sign-in` and `/sign-up` route configuration.

## 4. Files changed

- `app/sign-in/[[...sign-in]]/page.tsx`: removed `forceRedirectUrl="/"` from `<SignIn />` so Clerk path-routed callback/continue URLs are not overridden after sign-in.
- `app/sign-up/[[...sign-up]]/page.tsx`: removed `forceRedirectUrl="/"` from `<SignUp />` for the same callback-safe behavior.
- `tests/auth-entry-routes.test.ts`: added a regression test that the dedicated auth pages do not reintroduce `forceRedirectUrl`, while keeping direct-page fallback redirects to `/`.

## 5. What shipped

Dedicated Clerk auth pages still route direct visits back to `/` after successful direct auth through `fallbackRedirectUrl="/"`, but no longer force every auth completion to `/` when Clerk has its own callback or redirect URL in flight.

This is intentionally a narrow auth-route configuration fix. It does not change Reading/Listening, sample-answer content, app shell structure, Clerk provider architecture, Convex provider architecture, or saved learner data.

## 6. What was verified

Commands were run from `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only` with:

```bash
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
```

- `vitest run tests/auth-entry-routes.test.ts --pool=threads` -> PASS, 1 file / 2 tests.
- `vitest run --pool=threads` -> PASS, 35 files / 154 tests.
- `tsc --noEmit` -> PASS.
- `eslint .` -> PASS.
- `next build --webpack` -> PASS, compiled successfully and generated 9 static pages.
- Local production server smoke with `next start --port 3003`:
  - `/` returned HTTP 200.
  - `/sign-in` returned HTTP 200.
  - `/sign-up` returned HTTP 200.
  - rendered `/sign-in` payload contains `fallbackRedirectUrl="/"` and no `forceRedirectUrl`.
- `git push origin main` deployed `99e2b0b`.
- Production deployment smoke:
  - `https://score120coach.com/sign-in` returned HTTP 200 and live payload contains `fallbackRedirectUrl="/"` with no `forceRedirectUrl`.
  - `https://score120coach.com/sign-up` returned HTTP 200 and live payload contains `fallbackRedirectUrl="/"` with no `forceRedirectUrl`.
  - `https://score120coach.com/api/readiness` returned `ready:true`.
  - Public production routes `/`, `/sign-in`, `/sign-up`, `/support`, `/privacy`, `/terms`, `/beta`, and `/korea` returned HTTP 200.

## 7. What remains unverified

- Real production login with valid credentials.
- Whether the user's exact private-browser post-login failure is fully resolved.
- Signed-in Convex restore after real login.
- Full same-account/different-account browser matrix.
- Backup/export/reset/paste-import restore.
- Real support email send/receive.

The in-app browser tool was unavailable in this session, and no user credentials were provided, so no credentialed browser login was attempted.

## 8. Beta/onboarding decision

No change. Founder/internal smoke can continue, but external beta remains blocked until real-account production login/sync, backup/import restore, and support email checks pass.

## 9. Risks / rollback notes

This is a low-blast-radius change. If it causes an auth regression, rollback is the single commit `99e2b0b`, but reintroducing `forceRedirectUrl="/"` may also reintroduce callback interruption in private-browser auth flows.

## 10. Next smallest useful step

Run a real-account production smoke:

1. Open `https://score120coach.com/sign-in` in a private browser.
2. Sign in with the affected account.
3. Confirm the app lands on `/`, does not show the recovery page, and reaches `Cloud sync` / `Synced`.
4. Refresh and confirm progress restores.
5. Record the result in a new production smoke report.
