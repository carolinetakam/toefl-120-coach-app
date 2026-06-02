# Beta Operations

## Launch Gate

Do not onboard external beta users until these are true:

- Clerk production instance exists for `score120coach.com` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_live_`.
- Clerk production has a JWT template named `convex` using the Convex preset with `aud: "convex"`.
- `CLERK_SECRET_KEY` is a live key stored only in `.env.production.local` locally and later in the production host.
- Convex production deployment is configured with the production Clerk JWT issuer.
- `NEXT_PUBLIC_SUPPORT_EMAIL=support@score120coach.com` reaches a real monitored inbox through Cloudflare Email Routing.
- Privacy, Terms, Support, and Beta pages are live.
- The beta page has a learner-facing first-week path, support route, and safety language.
- Google OAuth is either configured with custom production credentials or disabled so email auth is the only visible launch path.
- `npm run lint`, `npm run test:run`, `npm run build`, Convex typecheck, and `npm audit --omit=dev` pass.

## First 5 Korean Beta Users

Invite only 5 learners. Do not expand until all five have either completed Day 1 or reported why they stopped.

Required first-session path: sign in, set profile, finish diagnostic, complete one mini mock, check Today plan, visit Support page.

Record for each learner: signup email, test date, target score, device/browser, Day 1 completion, first confusion point, support issue, scoring concern, and whether they returned on Day 2.

Launch-blocking risks: do not invite users if support email delivery is untested, `/api/readiness` is failing, production Clerk/Convex sync is unverified, or reset/export has not been manually checked with a signed-in account.

## Beta Cohort Process

1. Invite 5 Korean learners maximum for the first cohort.
2. Confirm each learner understands that scores are practice signals, not official TOEFL scores.
3. Ask each learner to sign in with email before serious practice.
4. Ask each learner to complete onboarding, diagnostic, one mini mock, and one practice block.
5. Record their first mock signal, top blocker, support issue, and whether the next daily plan made sense.
6. Do not expand the cohort until all critical issues are resolved.

## Support Triage

- P0: account/data access, wrong user data, deletion failure. Respond within one business day.
- P1: app crash, sync failure, broken mock submission. Respond within two business days.
- P2: confusing feedback, scoring disagreement, content issue. Respond within three business days.

## Data Requests

For deletion requests, verify the signed-in email, export data if requested, delete via the in-app reset or backend admin workflow, and confirm completion.
