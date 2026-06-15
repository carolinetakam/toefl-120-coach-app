# AGENTS.md

## Project Context

This is the TOEFL 120 Coach app project. The project-local architecture reference is stored at:

`docs/architecture/TOEFL_Coach_Architecture/`

Any agent or chat working in this project should treat that folder as the primary architecture reference before making product, code, content, or roadmap decisions.

## Required Reading Route

Use the folder system, not a giant context dump:

1. Read `docs/PROJECT_STATUS.md` for the current beta/launch state.
2. Read `docs/NEXT_PHASE_HANDOFF.md` for the next owner path and official launch sequence.
3. Read the latest relevant file in `docs/implementation-reports/` for the most recent implementation closeout.
4. Read `docs/architecture/TOEFL_Coach_Architecture/README.md`.
5. Read `docs/architecture/TOEFL_Coach_Architecture/FOLDER_SYSTEM_BLUEPRINT.md`.
6. Read `docs/architecture/TOEFL_Coach_Architecture/APP_AUDIT.md`.
7. Open only the task-specific architecture file needed for the current work.
8. Inspect the current app source before proposing or making code changes.

Do not load every architecture document by default.

## Mandatory Phase Closeout

At the end of every meaningful build, fix, deployment, smoke test, or product phase, follow `docs/PHASE_CLOSEOUT_PROCESS.md`:

1. create a report under `docs/implementation-reports/YYYY-MM-DD-short-phase-name.md`;
2. update `docs/PROJECT_STATUS.md` if readiness, blockers, verification, or shipped behavior changed;
3. update `docs/NEXT_PHASE_HANDOFF.md` if the next owner, next step, blocker, or launch path changed;
4. record exact tests/builds/production checks/manual checks run;
5. never claim beta/public launch readiness unless the live checks were actually completed and recorded.

For frontend/UI updates, also read:

1. `docs/Frontend_Building_Process_Package/AGENT_MAP.md`.
2. `docs/Frontend_Building_Process_Package/agent-handoff/FRONTEND_AGENT_HANDOFF.md`.
3. `docs/Frontend_Building_Process_Package/process/FRONTEND_BUILD_PROCESS.md`.
4. `docs/Frontend_Building_Process_Package/reference/MYRIAD_FRONTEND_PHILOSOPHY.md`.
5. `docs/Frontend_Building_Process_Package/reference/UI_COMPONENT_SPEC.md`.
6. Use `docs/Frontend_Building_Process_Package/checklists/FRONTEND_ACCEPTANCE_CHECKLIST.md` before handoff.

This frontend package defines the Myriad-inspired build process and product feel: real app first, calm premium operational UI, visible workflow, truthful state, shared button/card/control specs, and browser verification.

## Operating Rules

- Think in the 80/20 rule.
- Always find a way to accomplish the task.
- Be resourceful and self-improving.
- Do not ask the user to do things an agent can do itself.
- Try everything reasonable before asking for assistance.
- Use fewer monetary, compute, token, and operational resources whenever possible.
- Create production-ready work that is ready for users.
- Take ownership of the project and coordinate with other agents through the architecture folder.
- No stubs, no faking, and no pretending generated content or scoring is real when it is not validated.

## Product Direction

Build from the current app. Do not rebuild from scratch unless the user explicitly approves it.

Prefer:

- refactor over rewrite
- enrichment over raw generation
- deterministic scoring before AI
- stored strategy cards before live hints
- approved seed content before generated content
- first-user onboarding before platform expansion

Avoid unnecessary first-release features:

- payments
- full coach dashboards
- large admin panels
- complex adaptive engines
- raw full-test generation
- live AI hints where static cues work

## First User-Ready Loop

The first test-user-ready product should prove this loop:

1. profile setup
2. diagnostic or mini mockup
3. review
4. exact next drill
5. saved progress

Anything outside this loop is optional unless it directly improves reliability, trust, or learner completion.

## Content And Generation Rules

Use existing mini mockups and practice cards as seed content.

Agent-assisted content work should:

- tag and enrich existing seed content first
- add section, task type, question type, strategy card, difficulty, timing, traps, cues, explanations, and repair drill rules
- generate only missing variants, distractors, explanations, speaking/writing prompts, and repair drills
- assemble section mockups from approved mini mockups
- assemble full mock tests only from approved content pools
- keep raw generated content out of learner-facing flows until validated and approved

Never ask an agent to generate a full TOEFL mock test from scratch for the first user-ready app.

## Architecture Files

Use these project-local files:

- `docs/architecture/TOEFL_Coach_Architecture/README.md`
- `docs/architecture/TOEFL_Coach_Architecture/FOLDER_SYSTEM_BLUEPRINT.md`
- `docs/architecture/TOEFL_Coach_Architecture/APP_AUDIT.md`
- `docs/architecture/TOEFL_Coach_Architecture/TOEFL_Coach_App_Architecture.md`
- `docs/architecture/TOEFL_Coach_Architecture/REFACTOR_ROADMAP.md`
- `docs/architecture/TOEFL_Coach_Architecture/AGENT_COORDINATION.md`
- `docs/architecture/TOEFL_Coach_Architecture/STRATEGY_CARD_CATALOG.md`
