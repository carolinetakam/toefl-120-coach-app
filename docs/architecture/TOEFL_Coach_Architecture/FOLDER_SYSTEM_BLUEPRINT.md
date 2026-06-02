# TOEFL Coach Folder System Blueprint

Date: 2026-06-02

Purpose: make this architecture folder work as a low-cost AI workspace. Agents should use folder structure and small Markdown files as routing context instead of loading every document, creating unnecessary agents, or building heavy orchestration.

## Core Principle

The folder is the workspace. The documents are the routing system.

Agents should:

- read the smallest relevant file first
- follow file names, indexes, and task routing before opening larger docs
- avoid loading unrelated business, strategy, or technical material
- use existing app/source context before making recommendations
- preserve the current app and refactor only what serves the first user-ready loop

## Layer 1: Map

Use these files to understand where to go:

- `README.md`: package overview and current product constraints
- `APP_AUDIT.md`: current app reality and preferred refactor order
- `FOLDER_SYSTEM_BLUEPRINT.md`: folder routing rules
- `AGENTS.md`: agent operating rules

Layer 1 answers:

- What is this folder?
- What is the current app?
- What constraints must every task respect?
- Which document should be opened next?

## Layer 2: Workspace Context

Open only the context file that matches the task:

| Task | Open First | Open Next Only If Needed |
| --- | --- | --- |
| Product architecture | `TOEFL_Coach_App_Architecture.md` | `REFACTOR_ROADMAP.md` |
| First user-ready scope | `APP_AUDIT.md` | `REFACTOR_ROADMAP.md` |
| Agent/coding coordination | `AGENT_COORDINATION.md` | `AGENTS.md` |
| Strategy cards/cues | `STRATEGY_CARD_CATALOG.md` | `TOEFL_Coach_App_Architecture.md` section 2A |
| Content generation | `APP_AUDIT.md` | `TOEFL_Coach_App_Architecture.md` sections 7 and 7A |
| Roadmap/tickets | `REFACTOR_ROADMAP.md` | `APP_AUDIT.md` |

Layer 2 prevents token waste by keeping each task inside the right room.

## Layer 3: Tools And Skills

Use tools only when the task needs them:

- local shell/code tools: inspect or edit the app source
- Browser: verify local app flows or inspect a user-provided web page
- Linear: create/update issues only when requested
- document/spreadsheet/presentation skills: only for artifact creation
- AI/model generation: only for constrained enrichment, validation, variants, explanations, prompts, and repair drills

Do not turn on heavy tools by default. Do not add new model calls where deterministic code, cached records, or static strategy cards solve the task.

## Naming Conventions

Keep document names descriptive and task-routable:

- `APP_AUDIT.md`: source reality and current constraints
- `REFACTOR_ROADMAP.md`: order of implementation
- `STRATEGY_CARD_CATALOG.md`: strategy/cue source of truth
- `AGENT_COORDINATION.md`: handoff, QA, and release gates
- `FOLDER_SYSTEM_BLUEPRINT.md`: how agents should navigate this folder

Future docs should use narrow names, for example:

- `CONTENT_ENRICHMENT_SCHEMA.md`
- `FIRST_USER_ONBOARDING_CHECKLIST.md`
- `MINI_MOCKUP_ATTEMPT_CONTRACT.md`
- `REPAIR_DRILL_RULES.md`

Avoid one giant catch-all document. Split only when a file becomes too broad for a focused task.

## Default Agent Route

For most product/code tasks:

1. Read `README.md`.
2. Read `APP_AUDIT.md`.
3. Read only the task-specific file from the Layer 2 table.
4. Inspect the current app source before proposing implementation.
5. Prefer refactor/enrichment over rebuild.
6. Keep first-user onboarding and token cost constraints visible.

## First User-Ready Scope

The first user-ready app should not require a large agent system.

It should prove:

1. profile setup
2. diagnostic or mini mockup
3. review
4. exact next drill
5. saved progress

Anything outside that loop is optional unless it directly improves trust, reliability, or learner completion.

## Content Generation Route

Use this order:

1. Import existing mini mockups and practice cards as seed content.
2. Tag with section, task type, question type, strategy card, difficulty, timing, traps, cue, explanation, and repair rule.
3. Validate answer keys and ambiguity.
4. Approve reviewed seed content.
5. Generate only missing variants, distractors, explanations, speaking/writing prompts, and repair drills.
6. Assemble section mockups from approved mini mockups.
7. Assemble full mock tests only from approved content pools.

Never ask an agent to generate a full TOEFL mock test from scratch for the first user-ready app.

## Token-Saving Rules

- Do not paste full docs into prompts when a filename and focused summary are enough.
- Do not load all architecture files for every task.
- Use `rg` to locate relevant sections.
- Prefer exact line reads over whole-file reads after orientation.
- Cache generated explanations by content version.
- Cache scoring by response hash when AI scoring is introduced.
- Store strategy cues and reuse them; do not regenerate live hints.
- Summarize prior attempts before personalization.

## Quality Bar

This folder system is only useful if it creates better product decisions.

Every agent output should respect:

- current app first
- 80/20 scope
- cost-effective build
- no fake/generated content in production without approval
- no unnecessary first-release features
- first-user onboarding before platform expansion
