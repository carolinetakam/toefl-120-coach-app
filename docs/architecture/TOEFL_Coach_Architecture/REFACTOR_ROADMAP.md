# TOEFL Coach Refactor Roadmap

Date: 2026-06-02

This roadmap now assumes the current app source is available at `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`. The app is already a usable beta foundation, so the roadmap prioritizes refactor, content enrichment, reliable attempts, and first-user onboarding. Do not rebuild from scratch and do not start with full generated TOEFL mock tests.

## Non-Negotiable Constraints

- Apply the 80/20 rule.
- Reuse the existing app, mini mockups, practice cards, and learner flows.
- Spend fewer tokens and less money during both development and runtime.
- Prefer deterministic scoring, cached explanations, and stored cues before AI calls.
- Generate only missing pieces: variants, distractors, explanations, speaking/writing prompts, and repair drills.
- Assemble section and full mockups only from approved content pools.
- Avoid unnecessary first-release features: payments, full coach mode, large admin console, complex adaptive engine, raw full-test generation, or live AI hints.
- First user-ready onboarding must be complete, short, and honest: profile -> diagnostic or mini mock -> review -> next drill -> saved progress.

## Priority 0: Source Audit

Goal: know what exists before changing code.

Tasks:

- map routes, screens, components, backend endpoints, database tables, and AI calls
- identify where test content currently lives
- identify whether scoring is deterministic, AI-based, or mixed
- identify auth and payment boundaries
- measure current frontend failure points from beta feedback

Deliverable:

- `APP_AUDIT.md` with exact files, risks, and refactor order. This has been updated with the current app source audit.

## Priority 0A: First Test-User Onboarding

Goal: make the first beta user complete one valuable loop without help.

Tasks:

- keep onboarding short: name, target score, test date, daily minutes, confidence
- route the learner into diagnostic or mini mock immediately after onboarding
- after submission, show review, weakest skill, and one exact next drill
- save progress locally for guests and to Convex for signed-in users
- remove or hide any feature that distracts from the first loop

Acceptance:

- a new user can finish onboarding, take a diagnostic or mini mock, review results, and start the next drill in one session
- no placeholder, fake, or unvalidated content appears
- scoring language is clearly "practice estimate" where relevant

## Priority 1: Test Session Foundation

Goal: make existing mini mockup test-taking reliable before making it larger.

Tasks:

- create immutable `test_forms` from existing mini mockups first
- create `test_attempts` and `test_responses`
- add autosave for objective answers, speaking notes/checks, and writing drafts
- add idempotent submit
- support objective scoring
- keep timers simple for first release; upgrade to server-authoritative timers after attempts are reliable

Acceptance:

- refresh during test does not lose answers
- duplicate submit does not duplicate score
- completed attempt can always render a report

## Priority 2: AI Gateway and Cost Controls

Goal: prevent token waste before any model-assisted enrichment or scoring is added.

Tasks:

- route all model calls through one module/service
- add prompt versions
- add response schemas
- add token/cost logging
- add cache keys for scoring and explanations
- add feature budgets

Acceptance:

- one dashboard/query can show AI spend by feature
- unchanged writing/speaking responses are not rescored
- generated explanations for objective questions are reused

## Priority 3: Seed Content Enrichment

Goal: turn existing mini mockups and practice cards into approved, tagged, reusable content.

Tasks:

- import and tag existing mini mockups before generating full tests
- enrich seed content with section, task type, question type, strategy card, difficulty, timing, traps, hints/cues, explanations, and repair drill rules
- define a small content metadata schema
- attach strategy-card IDs from `STRATEGY_CARD_CATALOG.md`
- add mini mockup assembly rules for section and full mockups
- treat current content as approved seed only after metadata review

Acceptance:

- existing content can be assembled into practice, mini mockups, and section mockups
- every learner-facing item has a section, question type, explanation, and strategy mapping where relevant
- repair drill recommendation works without full-test generation

## Priority 3A: Constrained Generation

Goal: create TOEFL-like practice without letting raw generated content hit production or wasting tokens on full mock generation.

Tasks:

- create generation job table/API only after seed enrichment works
- define JSON schema per task type
- implement generation subagent contract for variants, distractors, explanations, prompts, and repair drills
- implement automated validators
- create a lightweight content approval workflow
- publish approved generated variants to beta content pool

Acceptance:

- subagent can generate a small structured draft variant or repair drill
- invalid content is rejected with useful reasons
- only approved content appears in learner flows
- full mockups are assembled only from approved existing or generated content
- the app can create targeted mini mockups and repair drills without full-test generation

## Priority 4: Strategy and Cue System

Goal: turn Andrew-style TOEFL strategy into interactive practice behavior.

Tasks:

- create `strategy_sources`, `strategy_cards`, `answer_cues`, `note_templates`, `response_templates`, and `exercise_blueprints`
- import Andrew's guide as a strategy source with provenance
- extract original strategy cards for Reading, Listening, Speaking, and Writing
- seed the first implementation from `STRATEGY_CARD_CATALOG.md`
- map question types to answer cues and mistake taxonomy
- create guided, hinted, exam, repair, and template rehearsal exercise modes
- ensure mock tests hide cues until review

Acceptance:

- every generated practice item can attach a strategy card when relevant
- guided practice shows a short actionable cue before or during the task
- review mode explains which strategy was missed and launches a repair drill
- strategy text is transformed and original, not copied wholesale from the guide

## Priority 5: Frontend Redesign

Goal: make the beta feel like a real coach app without replacing working flows unnecessarily.

Screens:

- dashboard
- test player
- review room
- skill practice library
- progress report
- content/admin review
- guided exercise player
- template rehearsal player
- cue and hint controls

Design priorities:

- fast next action
- quiet test-taking interface
- clear progress and weak-skill diagnosis
- polished mobile daily drills
- desktop-first full mock experience

Acceptance:

- learner can complete the core loop without help: start practice, submit, review, choose next drill
- all loading/error/empty states are production-ready
- mobile layout has no overlapping text or unstable controls
- guided cues appear in practice mode and disappear in mock mode

## Priority 6: Coach Intelligence

Goal: differentiate from generic prep apps.

Features:

- readiness estimate by target date
- weak-skill queue
- mistake taxonomy
- writing/speaking improvement plan
- practice streaks based on meaningful work, not just logins
- coach/teacher assignment mode

Acceptance:

- every completed attempt creates a next-step recommendation
- recommendations are explainable from performance data
- AI personalization uses summarized history, not full raw history

Do not build full coach/teacher assignment mode before the first test-user onboarding loop is proven.

## Priority 7: Production Readiness

Goal: beta can become a product users pay for.

Tasks:

- monitoring and alerts
- recording retention policy
- admin tools for failed jobs
- support diagnostics per user
- content retirement flow
- subscription limits and entitlements
- backup and restore check
- accessibility pass
- security review

Acceptance:

- failed scoring/generation jobs can be retried
- admin can remove bad content from future tests without breaking old reports
- users understand estimated scoring limits
- app can support paid beta users without manual intervention

## Suggested Linear/Epic Breakdown

- Epic 1: App audit and architecture alignment
- Epic 2: Test session engine
- Epic 3: AI gateway and model cost controls
- Epic 4: Content bank and generation pipeline
- Epic 5: Strategy cards, cues, templates, and repair drills
- Epic 6: Frontend test player
- Epic 7: Review room and progress dashboard
- Epic 8: Coach intelligence
- Epic 9: Production hardening

## Highest-ROI First Sprint

Week 1 should focus on:

1. finish first test-user onboarding loop
2. convert existing mini mockup into an immutable attempt flow
3. tag/enrich existing mini mockup and practice cards
4. attach one Reading strategy card and cue to existing content
5. add one repair drill rule from an actual missed pattern
6. inventory AI/model needs without adding live generation unless required

This produces visible beta value without taking on the whole platform, full-test generation, or a frontend rebuild at once.
