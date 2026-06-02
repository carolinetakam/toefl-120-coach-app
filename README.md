# TOEFL 120 Coach

Next.js 16 TOEFL coaching app focused on a mobile-friendly daily workflow, realistic practice loops, and a production migration path through Clerk and Convex.

## What is included
- onboarding profile
- baseline diagnostic snapshot
- adaptive daily plan
- practice screens for reading, listening, speaking, writing
- mini mock test with listening text-to-speech, hidden transcript, notes, speaking checklist, writing task, and objective review
- spaced review queue
- error log
- progress and practice-readiness dashboard
- XP and streak tracking
- Clerk sign-in UI with email enabled for production beta
- Convex schema/functions for authenticated full-state cloud sync
- localStorage guest mode plus isolated local server-backed state API for development only

## Honest product constraints
- Signed-in users sync sanitized progress to Convex. Signed-out users keep local browser-only guest progress.
- The guest state API is disabled in production unless `TOEFL_ENABLE_GUEST_STATE_API=true` is explicitly set.
- The current Convex sync stores full app snapshots. The normalized Convex tables are reserved for later analytics and event-specific mutations.
- Live Clerk keys are stored in `.env.production.local` for deployment use. Local development can keep using `.env.local` development keys.
- Production is deployed on Vercel at `https://score120coach.com`.
- Speaking recording depends on browser microphone + MediaRecorder support.
- The app is installable as a basic PWA, but it does not include offline caching/service worker support yet.
- Scoring is rule-based and intentionally modest. It does not claim official TOEFL, ETS, AI, or human scoring.
- Google OAuth is disabled in production until custom Google OAuth credentials are configured; this avoids a broken social-login option for beta learners.

## Run locally
```bash
npm install
npm run dev
```

Then open http://localhost:3000 on phone, tablet, or desktop browser.

## Production check
```bash
npm run lint
npm run test:run
npm run build
npm audit --omit=dev
```

## Production Gate

Set `REQUIRE_PRODUCTION_ENV=true` in a customer-facing deployment to make startup fail unless these are configured:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starting with `pk_live_`
- `CLERK_SECRET_KEY` starting with `sk_live_`
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_SUPPORT_EMAIL`

The readiness endpoint is available at `/api/readiness`.

Current production values:

- Public site domain: `score120coach.com`
- Production host: Vercel project `toefl-120-coach`
- Convex production backend: `https://brainy-chicken-240.convex.cloud`
- Clerk frontend API: `https://clerk.score120coach.com`
- Support email: `support@score120coach.com`

Do not commit `.env.production.local`; it contains the live Clerk secret key.

## Mobile notes
- iPhone/iPad home-screen install metadata and icons are included.
- Manifest orientation is left flexible so iPad landscape is not blocked.
- Inputs/buttons use 16px sizing to reduce iOS zoom friction.
- Reset now asks for confirmation before wiping local progress.

## Data behavior notes
- Saved writing drafts reload when you return to the same writing card.
- Saved speaking self-ratings/notes reload when you return to the same speaking card.
- Temporary recorded audio playback URLs are not persisted across refresh because blob URLs are browser-session only.

## Seed content note
The local seed bank now includes a larger TOEFL-style practice set:
- expanded diagnostic coverage across reading, listening, speaking, and writing subskills
- larger reading and listening multiple-choice banks for realistic exposure
- more independent and integrated speaking prompts
- more integrated and Academic Discussion writing prompts plus revision drills
- simple local prioritization that surfaces weaker and less-practiced cards first

## Founder notes
- Convex production migration: `docs/convex-production-plan.md`
- Beta operations: `docs/beta-operations.md`
- Launch campaign draft: `docs/launch-campaign.md`
- Korea-first beta operations: `docs/korea-beta-strategy.md`
