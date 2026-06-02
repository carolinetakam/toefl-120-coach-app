# AGENTS.md

## Project Rules

- Think in the 80/20 rule.
- Build from the current app; do not rebuild from scratch unless the user explicitly approves it.
- Prefer refactor, enrichment, migration, and reuse over new platform work.
- Always find a way to accomplish the task.
- Be resourceful and self-improving.
- Do not ask the user to do things an agent can do itself.
- Try everything reasonable before asking for assistance.
- Use fewer monetary, compute, and operational resources whenever possible.
- Create production-ready work that is ready for users.
- Take ownership of the project and coordinate with other agents in this folder.
- No stubs, no faking, and no pretending generated content or scoring is real when it is not validated.

## Local Project Context

This folder contains planning and architecture documents for a TOEFL coach app. The app source has now been inspected at:

`/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`

The current product is a lean Next.js, Clerk, and Convex beta app. It already includes onboarding, diagnostic practice, mini mockups, review, error logging, local guest mode, and authenticated full-state cloud sync. Treat this as the base product.

Primary documents:

- `FOLDER_SYSTEM_BLUEPRINT.md`
- `TOEFL_Coach_App_Architecture.md`
- `AGENT_COORDINATION.md`
- `REFACTOR_ROADMAP.md`
- `STRATEGY_CARD_CATALOG.md`
- `APP_AUDIT.md`

## Agent Workflow

Before making code-level recommendations, inspect the actual app source. Start with `FOLDER_SYSTEM_BLUEPRINT.md` and `APP_AUDIT.md`, then open only the task-specific document needed for the work.

Use the folder as the router:

- Layer 1: map and constraints
- Layer 2: task-specific context
- Layer 3: tools and skills only when needed

Do not load every document by default.

For TOEFL test generation:

- start from existing mini mockups and practice cards as seed content
- tag and enrich existing content before generating anything new
- generate only missing variants, distractors, explanations, cues, speaking/writing prompts, and repair drills
- assemble section mockups and full mock tests only from approved content pools
- generate only structured drafts
- validate schema and answer keys
- record provenance
- keep generated content out of production until approved
- do not claim official ETS scoring
- attach strategy cards and cues when relevant
- hide cues in mock-test mode and show them only in practice/review modes

For AI/model usage:

- route calls through an AI gateway
- version prompts
- cache stable outputs
- log tokens and estimated cost
- use deterministic scoring before AI where possible
- never use a model call for learner-facing hints when a stored strategy card or cue can serve the same purpose
- avoid live full-test generation for first-release learner flows

For study-guide sources:

- use guides as strategy sources, not raw public content
- extract transformed strategy cards, note templates, cue text, and drill blueprints
- avoid copying long passages into learner-facing UI
- keep source URL and extraction status in admin records

For first test-user onboarding:

- keep the flow short: profile, target score/date, diagnostic or mini mock, review, next drill, save progress
- do not add payments, full coach mode, large admin workflows, or complex adaptive engines before the first user-ready app
- all first-user flows must be complete, production-ready, and honest about scoring limits
- no placeholder screens, fake score claims, or unvalidated generated content
