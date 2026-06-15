# Implementation Report: Root Recovery Boundary

Date/time: 2026-06-16 00:24 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` after `2fcfe83 fix: recover from root workspace render crash`  
Owner/agent: Codex

## 1. Status

Done, pushed, force-deployed to Vercel production, and verified by local gates plus production route/readiness smoke.

## 2. Objective

Respond to the user report that simply opening `score120coach.com` still showed the route-level recovery page:

`Could not load your TOEFL workspace.`

The fix needed to make the root app recover without asking the user to manually clear browser storage and without deleting signed-in Convex/cloud data.

## 3. Starting point / handoff used

The screenshot showed Next's route-level `app/error.tsx` fallback. That meant the root app was crashing before `CoachApp` could show any internal sync recovery UI. Previous route/static checks were not enough because the user's browser state could still trigger a client render crash.

## 4. Files changed

- `components/coach-app-boundary.tsx`: added a client error boundary around the root app. On the first root render crash, it clears only TOEFL browser storage, marks safe recovery mode in `sessionStorage`, and reloads `/`. If recovery already ran, it shows a safe recovery panel with `Open safe mode`, `Retry`, and `Support`.
- `app/page.tsx`: wraps the home app in `CoachAppBoundary`.
- `components/coach-app.tsx`: reads the safe recovery flag on boot, starts local guest mode, skips authenticated cloud restore for that safe-mode session, and shows feedback that cloud progress was not deleted.
- `tests/recovery-boundary.test.ts`: adds source-level regression checks that the home route uses the boundary and safe mode does not call Convex deletion.

## 5. What shipped

Opening `score120coach.com` now hydrates the home app through `CoachAppBoundary`. If a saved browser-state/render error happens, the app should automatically recover into a local guest session instead of trapping the user in the generic route recovery page. Signed-in cloud data is not deleted.

## 6. What was verified

Commands were run from `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only` with:

```bash
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
```

- `vitest run tests/recovery-boundary.test.ts tests/progression.test.ts --pool=threads` -> PASS, 2 files / 16 tests.
- `vitest run --pool=threads` -> PASS, 36 files / 157 tests.
- `tsc --noEmit` -> PASS.
- `eslint .` -> PASS.
- `next build --webpack` -> PASS, compiled successfully and generated 9 static pages.
- Local production smoke with `next start --port 3005`:
  - `/` returned HTTP 200.
  - local root HTML referenced `CoachAppBoundary`.
- `git push origin main` pushed `2fcfe83`.
- GitHub push alone did not refresh the static root promptly, so `npx vercel --prod --yes` was run from the linked `.vercel` project.
- Vercel CLI completed and aliased the deployment to `https://score120coach.com`.
- Production smoke after forced deploy:
  - `https://score120coach.com/` returned HTTP 200 and live root HTML references `CoachAppBoundary`.
  - `/`, `/sign-in`, `/sign-up`, `/support`, `/privacy`, `/terms`, `/beta`, and `/korea` returned HTTP 200.
  - `https://score120coach.com/api/readiness` returned `ready:true`.

## 7. What remains unverified

- The user's exact browser opening `score120coach.com` after this forced deploy.
- Signed-in Convex restore after safe-mode recovery.
- Full same-account/different-account browser matrix.
- Backup/export/reset/paste-import restore.
- Real support email send/receive.

## 8. Beta/onboarding decision

No change. External beta remains blocked until real-account production login/sync, backup/import restore, and support email checks pass.

## 9. Risks / rollback notes

Safe mode clears TOEFL browser-local state only. It does not call `deleteConvexData` and does not reset production cloud data. The tradeoff is that a user with a bad local browser state may land in local guest mode and need to sign in again after the app is reachable.

Rollback is `2fcfe83`, but that can reintroduce the root route recovery trap.

## 10. Next smallest useful step

Open `https://score120coach.com` in the same affected browser. If it still shows the generic route recovery screen, hard refresh once. If it then opens, sign in again and verify whether cloud progress restores.
