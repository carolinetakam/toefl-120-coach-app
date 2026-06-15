# Implementation Report: Signed-In Auth State Priority

Date/time: 2026-06-16 00:31 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` at `baa16b2` before new commit  
Owner/agent: Codex

## 1. Status

Done locally and verified with focused tests, lint, typecheck after build regeneration, and production build.

## 2. Objective

Fix the mixed post-login auth state where Clerk showed a signed-in user, but the app sidebar still showed `Guest learner`, `Guest mode`, and `Save Local`.

## 3. Starting point / handoff used

User screenshot evidence showed Clerk was signed in while app data mode remained guest/local. The inspected paths were limited to `components/coach-app.tsx` auth state, guest session handling, signed-out-local handling, sync readiness/save status, Convex restore, and TOEFL local/session storage keys.

## 4. Files changed

- `components/coach-app.tsx`: makes Clerk signed-in state win over stale guest/safe-recovery state in `authState`, clears stale guest session, safe-recovery mode, and local sign-out state when Clerk reports a signed-in user, then resets sync readiness so the Convex restore path runs again. The onboarding signed-in and guest prompt panels now key off app `authState` instead of raw Clerk state, preventing body/sidebar disagreement.
- `tests/recovery-boundary.test.ts`: adds a source-level regression check that signed-in Clerk state clears guest recovery storage and uses authenticated app state for the signed-in panel.

## 5. What shipped

After Clerk becomes signed in, the app no longer remains pinned to local guest/recovery state, even on the first render. It removes `toefl-120-coach-guest-session`, removes `toefl-120-coach-recovery-mode`, clears `signedOutLocally`, sets save status to `Syncing`, and allows the authenticated Convex query/restore path to decide between `Synced` and `Offline`.

## 6. What was verified

Commands were run from `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only` with:

```bash
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
```

- `vitest run tests/recovery-boundary.test.ts tests/sync-ownership.test.ts --pool=threads` -> PASS, 2 files / 7 tests.
- `vitest run --pool=threads` -> PASS, 36 files / 158 tests.
- `eslint components/coach-app.tsx tests/recovery-boundary.test.ts` -> PASS.
- `next build --webpack` -> PASS, compiled successfully and generated 9 static pages.
- `tsc --noEmit` initially failed because stale `.next/types` files were missing; after `next build --webpack` regenerated them, `tsc --noEmit` -> PASS.

## 7. What remains unverified

- Real production Clerk account login after this exact patch.
- Production Convex restore from an existing signed-in account.
- Browser screenshot confirmation that the sidebar now shows authenticated/cloud mode.
- Same-account/different-account sync matrix.
- Backup/reset/import and support email checks.

## 8. Beta/onboarding decision

No change. External beta remains blocked until real-account production login/sync, backup/import restore, and support email checks pass.

## 9. Risks / rollback notes

This is intentionally narrow. It changes only client auth-state reconciliation and one auth-gated panel condition. If a user clicks logout, the existing explicit sign-out flow still clears local state and calls Clerk sign-out. Rollback is this patch if production retest shows sign-out UI no longer responds immediately.

## 10. Next smallest useful step

Deploy this patch, open `https://score120coach.com` in the affected browser, sign in with a real test account, and confirm the sidebar shows `Cloud sync` with either `Save Synced` or `Save Offline`, not `Guest mode` / `Save Local`.
