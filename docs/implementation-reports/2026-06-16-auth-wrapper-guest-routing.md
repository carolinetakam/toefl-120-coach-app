# Implementation Report: Auth Wrapper Guest Routing

Date/time: 2026-06-16 02:05 KST
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`
Branch/head: `main` / `a3adc20` before this working-tree change
Owner/agent: Codex

## 1. Status

Done locally. Automated gates pass. Not deployed in this phase.

## 2. Objective

Fix only the auth page wrapper and guest routing issues reported from production: keep Clerk controls unobstructed during verification/factor-two, remove misleading loading copy after Clerk renders an auth step, and make `Continue as guest` explicitly start guest mode instead of routing to a logged-out root redirect.

## 3. Starting point / handoff used

Used the user production findings plus `docs/PROJECT_STATUS.md`, `docs/NEXT_PHASE_HANDOFF.md`, the latest auth implementation reports, and the architecture folder route. Scope intentionally excluded auth rebuilds, seed/sample-answer content, Reading/Listening, Convex sync, and model-answer workflow.

## 4. Files changed

- `components/auth-entry-panel.tsx`: always renders the Clerk mount as visible/clickable; changes loading copy to passive helper text below the Clerk surface; removes the slow-load card and old `Sign-in form is still loading` state; points auth-page guest link to `/?guest=1`.
- `app/globals.css`: removes the hidden absolute `.authClerkMount:not(.ready)` state and replaces the card-like loading panel with passive helper/link styles.
- `app/sign-in/[[...sign-in]]/page.tsx`: changes page-level `Continue as guest` link to `/?guest=1`.
- `app/sign-up/[[...sign-up]]/page.tsx`: changes page-level `Continue as guest` link to `/?guest=1`.
- `components/coach-app.tsx`: handles `guest=1` while unauthenticated by calling existing `continueAsGuest`, then removes the query param with `history.replaceState`; the signed-out root redirect now lets `guest=1` initialize instead of bouncing to `/sign-in`.
- `tests/auth-entry-routes.test.ts`: updates auth-entry regression coverage for passive helper copy and explicit guest query links.
- `tests/recovery-boundary.test.ts`: adds regression coverage for the `guest=1` root-routing exception and URL cleanup.

## 5. What shipped

Locally, `/sign-in` and `/sign-up` no longer hide the Clerk component behind app fallback UI. Helper copy is passive and below the Clerk mount. All auth-page `Continue as guest` links use `/?guest=1`, and the root app starts the existing guest flow from that query before cleaning the URL.

## 6. What was verified

- `vitest run tests/auth-entry-routes.test.ts tests/recovery-boundary.test.ts --pool=threads` -> 2 files / 11 tests passed.
- Focused `eslint` on touched files -> passed.
- `vitest run --pool=threads` -> 38 files / 166 tests passed.
- `tsc --noEmit` -> passed.
- `eslint .` -> passed.
- `next build --webpack` -> compiled successfully and generated 9 static pages.
- Static source check confirmed no `Sign-in form is still loading`, no `.authClerkMount:not(.ready)`, no `pointer-events: none` auth mount rule, and `/?guest=1` links are present on auth entry surfaces.

## 7. What remains unverified

- Real production Clerk email/password and factor-two click-through were not retested because no live credentials/OTP were available in this session.
- Local browser smoke was attempted, but the in-app browser was unavailable and Playwright is not installed in this repo/runtime. No browser dependency was added for this narrow fix.
- Production deployment and production route smoke were not run in this phase.

## 8. Beta/onboarding decision

No beta clearance change. External beta remains blocked until the real-account production auth/sync smoke, backup/reset/import restore, and support email receipt checks pass and are recorded.

## 9. Risks / rollback notes

The change is limited to auth-entry wrapper rendering and guest-query startup. Rollback would restore the old hidden Clerk mount and `/` guest links, which would reintroduce the reported interception and redirect-loop risks. The root `guest=1` handler reuses the existing `continueAsGuest` behavior and does not touch Convex/cloud data.

## 10. Next smallest useful step

Deploy this patch, then retest production `/sign-in` with a real account through password and factor-two. Also click `Continue as guest` from `/sign-in` and confirm it lands in guest mode with the URL cleaned to `/`.
