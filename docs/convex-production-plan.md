# Convex Production Plan

## Current Boundary

Signed-in users sync sanitized progress to Convex under Clerk identity. Signed-out users are local browser-only. The old `/api/state` JSON fallback remains for development but is disabled in production unless `TOEFL_ENABLE_GUEST_STATE_API=true` is explicitly set.

## Target Backend

Use Convex as the source of truth for signed-in learners and keep localStorage only as a guest/offline backup.

Official Convex setup path:

```bash
npm install convex
npx convex dev
```

Convex will create the `convex/` folder and deployment URL. Add the URL to:

```bash
NEXT_PUBLIC_CONVEX_URL=
```

Current development deployment:

```bash
NEXT_PUBLIC_CONVEX_URL=https://pleasant-quail-129.convex.cloud
```

Current production deployment:

```bash
NEXT_PUBLIC_CONVEX_URL=https://brainy-chicken-240.convex.cloud
```

Current Clerk development app:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YXNzdXJpbmctc25ha2UtMzkuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_JWT_ISSUER_DOMAIN=https://assuring-snake-39.clerk.accounts.dev
```

The Clerk secret key is stored only in `.env.local`, which is gitignored.
The development Clerk instance has a JWT template named `convex` using Clerk's Convex preset with `aud: "convex"`.

Current Clerk production app:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuc2NvcmUxMjBjb2FjaC5jb20k
CLERK_JWT_ISSUER_DOMAIN=https://clerk.score120coach.com
```

The production Clerk secret key is stored only in `.env.production.local`, which is gitignored.
The production Clerk instance has a JWT template named `convex` using Clerk's Convex preset with `aud: "convex"`.

Current production domain status:

- `score120coach.com` is registered through Cloudflare.
- Vercel serves `score120coach.com` and `www.score120coach.com` through DNS-only Cloudflare A records.
- Clerk DNS records for `clerk`, `accounts`, `clkmail`, `clk._domainkey`, and `clk2._domainkey` are configured and verified.
- Clerk SSL certificate issuance is pending after DNS verification.
- `support@score120coach.com` is active in Cloudflare Email Routing and forwards to the verified owner inbox.

## Schema

User-owned tables:

- `users`: auth identity, email/name, timestamps
- `profiles`: target score, test date, daily minutes, confidence
- `progress`: diagnostic state, section/subskill scores, track, XP, streak
- `practiceResults`: scored practice and mock-test attempts
- `reviewCards`: spaced review queue
- `errorEntries`: classified mistakes and correction lifecycle
- `writingDrafts`: private writing submissions and revisions
- `speakingAttempts`: private notes plus optional Convex file storage ID for audio
- `appStates`: strict full-state snapshot used by the current client sync path

Indexes:

- `users.by_tokenIdentifier`
- `profiles.by_userId`
- `progress.by_userId`
- `practiceResults.by_user_completedAt`
- `reviewCards.by_user_dueDate`
- `errorEntries.by_user_corrected_dueDate`
- `writingDrafts.by_user_promptId`
- `speakingAttempts.by_user_promptId`

## Mutation Design

The browser should send intent, not arbitrary full-state patches.

Current production sync:

- `coach.getAppState`
- `coach.saveAppState`
- `coach.deleteMyData`

Next event-based mutations:

- `coach.getSnapshot`
- `coach.saveProfile`
- `coach.finishDiagnostic`
- `coach.recordObjectiveResult`
- `coach.submitMockTest`
- `coach.submitWriting`
- `coach.submitSpeaking`
- `coach.reviewCard`
- `coach.importSnapshot`
- `coach.deleteMyData`

Move XP, streaks, score updates, error creation, and review scheduling into Convex mutations before public launch.

## Auth

Use Clerk + Convex for the fastest production path. Every query and mutation must require identity and filter documents by `userId`.

Do not launch with anonymous cloud writes. TOEFL writing, speaking notes, and audio are sensitive educational data.

For the first production deployment, set the Convex auth issuer to:

```bash
CLERK_JWT_ISSUER_DOMAIN=https://clerk.score120coach.com
```

Keep the development Convex deployment on the development Clerk issuer unless the local environment is intentionally switched to production Clerk keys for an end-to-end production smoke test.

## Revenue-Ready Backend Phases

1. Convex auth and user-owned data.
2. Event-based mutations for practice, review, writing, and speaking.
3. Stripe subscription metadata and usage limits.
4. Optional AI scoring actions for paid speaking/writing feedback.
5. Tutor review workflow for premium human feedback.
