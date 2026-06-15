# Implementation Report: Logout Guest Auth State Fix

Date/time: 2026-06-15 13:40 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` / local changes after `78545fe`  
Owner/agent: Codex

## 1. Status

Done locally. Not deployed in this phase.

## 2. Objective

Fix the logout/login/guest access trust issue without changing the current app structure, routes, layout, or navigation model.

## 3. Starting point / handoff used

Used:

- `docs/PROJECT_STATUS.md`
- `docs/NEXT_PHASE_HANDOFF.md`
- `docs/Frontend_Building_Process_Package/AGENT_MAP.md`
- `docs/Frontend_Building_Process_Package/agent-handoff/FRONTEND_AGENT_HANDOFF.md`
- `docs/Frontend_Building_Process_Package/process/FRONTEND_BUILD_PROCESS.md`
- `docs/Frontend_Building_Process_Package/reference/MYRIAD_FRONTEND_PHILOSOPHY.md`
- `docs/Frontend_Building_Process_Package/reference/UI_COMPONENT_SPEC.md`
- `docs/Frontend_Building_Process_Package/checklists/FRONTEND_ACCEPTANCE_CHECKLIST.md`
- `components/coach-app.tsx`
- `app/globals.css`

## 4. Files changed

- `components/coach-app.tsx`
  - Added explicit `AuthStatus`, `AuthState`, and `GuestSession` model.
  - Added explicit guest-session storage instead of treating every signed-out user as guest.
  - Stopped loading local personalized state before auth state is known.
  - Blocks personalized workspace content while auth is loading or unauthenticated.
  - Logout clears app-local progress/cache, guest session, local owner marker, diagnostic timer, and app session storage.
  - Added `Log In`, `Continue as Guest`, and `Create Account` actions in existing sidebar and hero action areas.
  - Added signed-out prompt in the existing main content column.
  - Added guest badge/banner and account actions in the existing UI.
- `app/globals.css`
  - Added small styles for signed-out status dot, auth prompt, auth controls, centered actions, and guest banner.
- `docs/NEXT_PHASE_HANDOFF.md`
  - Added the requested engineering-plan addendum for logout, login state, and guest access.

## 5. What shipped

Local app behavior now separates:

- `loading`: personalized content hidden until auth state resolves.
- `authenticated`: Clerk user + Convex sync path.
- `guest`: explicit local-only guest session.
- `unauthenticated`: signed-out prompt with `Log In`, `Continue as Guest`, and `Create Account`.

## 6. What was verified

Automated checks:

- `tsc --noEmit` -> PASS.
- `eslint components/coach-app.tsx` -> PASS.
- `eslint .` -> PASS.
- `vitest run tests/sync-ownership.test.ts --pool=threads` -> PASS, 4 tests.
- `vitest run` -> PASS, 25 files / 121 tests.
- `next build --webpack` -> PASS.

Browser verification:

- In-app Browser plugin was unavailable in this session (`iab` unavailable), so local verification used system Chrome through Playwright.
- Production-mode local server: `next start -p 3002`.
- Desktop clean signed-out state showed:
  - signed-out prompt;
  - `Log In`;
  - `Continue as Guest`;
  - `Create Account`;
  - no personalized `Today's mission`.
- Guest state after `Continue as Guest` showed:
  - `Guest mode`;
  - `Guest learner`;
  - `Log In`;
  - `Create Account`;
  - onboarding available.
- Mobile clean signed-out state showed:
  - signed-out prompt;
  - `Log In`;
  - `Continue as Guest`;
  - no horizontal overflow.

## 7. What remains unverified

- Real production Clerk logout/login flow was not tested with a real account in this phase.
- Cross-browser Convex restore matrix remains unverified.
- This change has not been deployed to production yet.

## 8. Beta/onboarding decision

**BETA BLOCKED**

This fixes the local logout/guest UI trust issue, but external beta is still blocked until the real production sync matrix, backup/restore smoke, and support email checks pass.

## 9. Risks / rollback notes

- Signed-out users no longer automatically inherit existing local progress. They must explicitly choose guest mode.
- New guest mode is local-only and clearly labeled.
- Public content remains available through guest mode.
- Temporary sync instrumentation from the prior sync pass remains in place.

## 10. Next smallest useful step

Deploy this auth-state fix, then rerun:

1. logout -> signed-out UI appears immediately;
2. refresh after logout -> signed-out UI remains;
3. continue as guest -> guest banner appears;
4. User A same-account cross-browser restore;
5. User B isolation.
