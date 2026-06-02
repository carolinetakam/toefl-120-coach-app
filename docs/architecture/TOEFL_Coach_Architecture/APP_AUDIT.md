# TOEFL Coach App Source Audit

Date: 2026-06-02

## Result

The app source has been inspected at:

`/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`

The current app is not a blank slate. It is a lean Next.js 16, React 19, Clerk, and Convex beta product with a useful first-user loop already present.

## Current App Summary

Implemented:

- onboarding profile with target score, test date, daily minutes, and confidence inputs
- diagnostic questions across Reading, Listening, Speaking, and Writing
- adaptive daily plan based on weak sections and due review
- practice cards for all four sections
- mini mockup flow with objective questions, listening script, speaking checklist, writing task, and review
- spaced review queue
- error log
- readiness/progress dashboard
- XP and streak tracking
- localStorage guest mode
- authenticated Convex full-state sync
- production readiness endpoint
- support, beta, Korea, privacy, and terms pages

Current source anchors:

- `package.json`
- `components/coach-app.tsx`
- `lib/seed.ts`
- `lib/mock-tests.ts`
- `lib/logic.ts`
- `lib/planner.ts`
- `lib/reporting.ts`
- `lib/storage.ts`
- `lib/validation.ts`
- `convex/schema.ts`
- `convex/coach.ts`
- `app/api/state/route.ts`
- `app/api/readiness/route.ts`

## Current Architecture Reality

- Frontend: Next.js app router with one main client app component.
- Auth: Clerk.
- Database/sync: Convex, currently using authenticated full-state snapshots plus reserved normalized tables.
- Content model: static TypeScript seed arrays for diagnostics, practice cards, and mini mockups.
- Scoring: deterministic/rule-based; no official ETS score claims.
- AI/model calls: none found in the current app source.
- Test sessions: client-state mini mockup flow, not yet immutable server-backed attempts.
- Speaking recordings: browser MediaRecorder/local blob playback; no durable recording upload in the current learner flow.

## Product Interpretation

The next step is not a rebuild and not full generated TOEFL tests. The cost-effective path is to turn the existing seed content into a lightweight content bank, then add reliable attempts and targeted repair.

Use this order:

1. Preserve existing onboarding, daily plan, practice, mini mockup, review, and error-log flows.
2. Convert current `practiceCards` and `mockTests` into approved seed content records.
3. Tag/enrich seed content with section, task type, question type, strategy card, difficulty, timing, traps, cues, explanations, and repair rules.
4. Add immutable attempts, responses, autosave, and idempotent submit.
5. Generate only missing variants, distractors, explanations, speaking/writing prompts, and repair drills.
6. Assemble section mockups from approved mini mockups.
7. Assemble full mock tests only from approved content pools.

## First User-Ready Constraints

- Apply the 80/20 rule.
- Refactor the current app; do not build from scratch.
- Save tokens and money during build and runtime.
- Use deterministic scoring before AI.
- Cache generated explanations and scoring by content/response hash.
- Avoid unnecessary first-release features: payments, full coach dashboard, large admin console, complex adaptive engine, raw full-test generation, or live AI hints.
- First test-user onboarding should prove one loop: profile -> diagnostic or mini mock -> review -> exact next drill -> saved progress.

## Verification Notes

- `eslint .` completed successfully when run directly through the local binary with the Codex app Node runtime on PATH.
- `vitest run` could not start in this environment because the installed native `rolldown` binding was blocked by macOS code-signing under the Codex Node process.
- The app folder is not currently a git repository.

## Refactor Tickets To Prefer First

1. Add a minimal Convex content schema for approved seed content and versions.
2. Migrate existing `lib/seed.ts` and `lib/mock-tests.ts` data into seedable content records or a typed registry with metadata.
3. Add `testForms`, `testAttempts`, and `testResponses` for mini mockups first.
4. Add autosave and idempotent submit for mini mockup attempts.
5. Add strategy-card IDs and concise cues from `STRATEGY_CARD_CATALOG.md`.
6. Add repair drill rules for the most common Reading and Listening misses.
7. Add a small first-user onboarding path that takes the learner directly to a diagnostic or mini mock and then a next drill.
