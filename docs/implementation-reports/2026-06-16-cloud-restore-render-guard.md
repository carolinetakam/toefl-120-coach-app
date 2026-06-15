# Implementation Report: Cloud Restore Render Guard

Date/time: 2026-06-16 00:46 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` at `46b6173` after `fix: guard cloud restore render state`  
Owner/agent: Codex

## 1. Status

Done, pushed, force-deployed to Vercel production, and verified with focused render tests, full tests, lint, typecheck, production build, and production route/readiness smoke.

## 2. Objective

Respond to the user report that after the auth-state priority fix, production briefly loads the signed-in diagnostic/workspace and then switches to the `Could not load your TOEFL workspace` recovery page.

## 3. Starting point / handoff used

The new screenshot showed `CoachAppBoundary`, which means auth was progressing and the app then hit a client render error after restored state entered the workspace. The user described the page briefly showing login state and diagnostic before the recovery screen, so this phase treated Convex restore/render safety as the likely failure point.

## 4. Files changed

- `components/coach-app.tsx`: added `assertRenderableAppState()` and runs it immediately after sanitizing Convex state, before replacing the current renderable app state. If the restored snapshot fails any top-level app derivation used by the UI, the app now stays open in authenticated `Sync offline` mode instead of tripping the root recovery boundary. Convex/cloud data is not deleted or overwritten.
- `tests/recovery-boundary.test.ts`: records the source-level restore guard contract.
- `tests/signed-in-restore-render.test.ts`: adds a jsdom regression with mocked Clerk and Convex using the available real backup-shaped signed-in state.

## 5. What shipped

Cloud restore now has a defensive render-safety gate. A malformed or edge-case cloud snapshot should degrade to authenticated local practice with `Save Offline` / sync recovery copy instead of taking down the root app.

## 6. What was verified

Commands were run from `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only` with:

```bash
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
```

- `vitest run tests/recovery-boundary.test.ts tests/signed-in-restore-render.test.ts --pool=threads` -> PASS, 2 files / 5 tests.
- `tsc --noEmit` -> PASS.
- `vitest run --pool=threads` -> PASS, 37 files / 160 tests.
- `eslint components/coach-app.tsx tests/recovery-boundary.test.ts tests/signed-in-restore-render.test.ts` -> PASS.
- `next build --webpack` -> PASS, compiled successfully and generated 9 static pages.
- `git push origin main` -> pushed `46b6173`.
- `npx vercel --prod --yes` -> deployment `dpl_2fWZUk8pCM22o5puoRJzeYX4MDCv` reached `READY` and was aliased to `https://score120coach.com`.
- `curl -fsS https://score120coach.com/api/readiness` -> `ready:true`.
- Production route smoke -> `/`, `/sign-in`, `/sign-up`, `/beta`, `/support`, `/privacy`, `/terms`, `/korea` all returned HTTP 200.
- Live root bundle check found `CLOUD_RESTORE_RENDER_CHECK_FAILED` in deployed `/_next/static/chunks/app/page-c2b16a1d15910192.js`.

## 7. What remains unverified

- The exact affected production browser/account after deployment.
- The exact exception from the user’s current Convex snapshot, because the in-app browser was unavailable in this session and production client console logs are not available from the server.
- Full signed-in same-account/different-account browser matrix.

## 8. Beta/onboarding decision

No change. External beta remains blocked until real-account production login/sync, backup/import restore, and support email checks pass.

## 9. Risks / rollback notes

This is a containment fix, not a destructive data fix. If a cloud snapshot is judged unsafe, it is not deleted and the app does not save over it from the failed restore branch. The user may see sync-offline local practice until the underlying cloud snapshot edge case is identified.

## 10. Next smallest useful step

Open `https://score120coach.com` in the affected browser and confirm the app stays in the workspace. If it shows `Sync offline`, export/show backup JSON from the local workspace and inspect the cloud snapshot shape before attempting any data repair.
