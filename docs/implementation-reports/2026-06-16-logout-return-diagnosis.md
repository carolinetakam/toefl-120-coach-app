# Implementation Report: Logout Return Diagnosis

Date/time: 2026-06-16 02:21 KST
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`
Owner/agent: Codex

## 1. Status

Diagnosis only. No auth behavior, app routing, Clerk, Convex, or storage code was changed.

## 2. Objective

Investigate the production founder-account report:

`logout -> brief navigation -> return to the same application page`

The goal was to identify the exact state transition causing re-entry into the app, not to add another auth fix.

## 3. Evidence gathered

- Inspected `components/coach-app.tsx`, `components/auth-entry-panel.tsx`, `components/coach-app-boundary.tsx`, and production HTML/bundles from `https://score120coach.com`.
- Confirmed Chrome and Safari were open on `https://score120coach.com/`.
- Tried to execute an in-page diagnostic probe through Chrome and Safari Apple Events.
  - Chrome refused because `Allow JavaScript from Apple Events` is disabled.
  - Safari refused because `Allow JavaScript from Apple Events` is disabled.
- Searched Chrome/Safari browser storage files for auth-related TOEFL and Clerk keys.
  - No readable `toefl-120-coach`, `score120coach`, or Clerk local/session storage entries were found from the shell.
- Confirmed production `/sign-in` is still on the older deployed auth wrapper:
  - server HTML includes `authLoadingPanel`;
  - auth-page `Continue as guest` still links to `/`, not `/?guest=1`;
  - the local auth-wrapper guest-routing patch is not deployed.

## 4. Requested capture fields

Could not directly capture live in-page Clerk values from the founder browser because browser JavaScript automation is disabled:

- `isSignedIn`
- `userId`
- `sessionId`
- `guest mode flag`
- `safe recovery flag`
- local signout flag
- sync status
- current learner id
- signOut call/resolve/session-disappear timing

Important limitation: this is an environment access blocker, not evidence that those values do not exist. The active page is reachable, but JavaScript inspection inside that page is blocked by browser settings.

## 5. Storage finding

No auth-related TOEFL local/session storage key was found that can explain forced re-entry into the app.

The app-local keys that can affect auth/app mode are:

- `toefl-120-coach-state`
- `toefl-120-coach-client-id`
- `toefl-120-coach-sync-owner`
- `toefl-120-coach-guest-session`
- `toefl-120-coach-recovery-mode`
- `toefl-120-coach-recovery-attempted`
- `toefl-120-coach-diagnostic-started-at`
- `toefl-120-coach-launch-smoke-checks`
- `toefl-120-coach-preferences`

From source inspection, none of these keys can independently force a Clerk-authenticated re-entry after logout. Guest mode can force app entry only when `toefl-120-coach-guest-session` exists or `?guest=1` is handled. Safe recovery can force local guest mode only when `toefl-120-coach-recovery-mode=1` exists. Neither was found in readable browser storage from the shell.

## 6. Exact transition identified

The likely bug is a client route race in `components/coach-app.tsx`:

1. User clicks the custom `Logout` button.
2. `handleSignOut()` immediately runs local app signout work:
   - `setSignedOutLocally(true)`;
   - clears guest/local progress/session storage;
   - resets UI state;
   - sets app state to `initialState`;
   - sets save status to `Local`.
3. Before Clerk confirms the session is gone, `authState` can become `unauthenticated` because it depends on `signedOutLocally`.
4. The unauthenticated redirect effect immediately runs:
   - `window.location.assign('/sign-in')`.
5. The app navigates to `/sign-in` while the Clerk browser session may still be active.
6. Clerk's sign-in route sees an active session and can route/fallback back to `/`.
7. The root app remounts. The React-only `signedOutLocally` flag is gone because it was not persisted.
8. Clerk still reports signed in, so the app renders authenticated/app content again.

This matches the user-visible behavior: logout starts, navigation briefly begins, then the user is returned to the same app page.

## 7. Secondary ambiguity

There are two signout surfaces with different destination behavior:

- custom `Logout` / `Sign out / switch account`: `signOut({ redirectUrl: '/sign-in' })`;
- Clerk `UserButton`: `afterSignOutUrl="/"`.

This does not by itself prove session deletion failed, but it makes route observation ambiguous during production debugging.

## 8. Why profile/progress can fail after this loop

The custom logout path clears browser-local TOEFL state before Clerk signout is confirmed. If the route race returns the user to `/` while Clerk remains signed in, the app remounts as authenticated but local progress has already been deleted. The restore then depends entirely on Convex returning a valid cloud snapshot for the current Clerk identity. If Convex lookup or restore is slow/empty/offline, the user sees incomplete/default profile/progress.

## 9. Conclusion

The current evidence points to Clerk session persistence during a premature app-driven route transition, not a TOEFL localStorage key forcing re-entry.

The exact transition to verify in a live instrumented browser is:

`setSignedOutLocally(true) -> authState='unauthenticated' -> window.location.assign('/sign-in') -> Clerk session still active -> /sign-in redirects/falls back to / -> app remounts signed in`

## 10. Next diagnostic-only action

Use a temporary diagnostic trace, not an auth fix, to log these timestamps in the affected browser:

- before custom logout click: Clerk `isSignedIn`, `userId`, `sessionId`, app mode, storage keys;
- immediately before `signOut()`;
- after `signOut()` resolves;
- after `/sign-in` navigation starts;
- after root remount/reload;
- storage key dump after reload.

Do not change route behavior until that trace confirms whether `/sign-in` is happening before Clerk session removal.
