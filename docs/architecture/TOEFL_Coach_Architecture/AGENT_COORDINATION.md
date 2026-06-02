# Agent Coordination for TOEFL Coach

Date: 2026-06-02

Purpose: define how coding agents, content agents, test-generation subagents, and reviewer agents work together without corrupting production content or wasting tokens.

## Operating Principles

- Work in small, reviewable changes.
- Prefer the existing app patterns. The current app source is available at `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`.
- Do not rebuild from scratch unless the user explicitly approves it.
- Use the 80/20 rule: first ship the smallest reliable learner loop that proves value.
- Save tokens and runtime cost: deterministic logic, cached outputs, compact prompts, and stored cues before model calls.
- Use the folder system in `FOLDER_SYSTEM_BLUEPRINT.md`: map first, task context second, tools only when needed.
- Do not fake test content, scores, audio, or model outputs.
- Generated tests must be schema-valid, versioned, and reviewable.
- Every production model call must be observable and budgeted.
- Ask the user only after local inspection and reasonable attempts are exhausted.

## Agent Roles

### Product Architect Agent

Owns architecture documents, roadmaps, cross-module decisions, and risk tradeoffs.

Outputs:

- architecture decision records
- refactor plan
- feature acceptance criteria
- release checklist

### Frontend Agent

Owns user-facing flows.

Scope:

- practice dashboard
- test player
- review room
- content admin screens
- mobile responsiveness
- accessibility

Definition of done:

- user can start, complete, submit, and review a test
- all primary flows work on desktop and mobile
- timers, recording, audio, and autosave have visible states
- no placeholder UI in production routes

### Backend Agent

Owns APIs, database, queues, scoring orchestration, auth, and observability.

Definition of done:

- endpoints validate input and return typed errors
- attempts are immutable after submission except admin correction flows
- jobs are retryable and idempotent
- model calls go through AI gateway
- usage and cost events are logged

### Test Generation Subagent

Owns draft content generation and content enrichment only.

Allowed:

- tag and enrich existing mini mockups and practice cards
- create structured content drafts
- create missing variants, distractors, explanations, prompts, and repair drills
- produce answer keys and rationales
- tag CEFR/difficulty estimates
- identify content risks

Not allowed:

- generate full TOEFL mock tests from scratch for first-release learner flows
- replace approved seed content when enrichment would solve the problem
- write directly to approved production pools
- bypass validators
- claim official TOEFL scoring
- use copyrighted passages or copied prep-book material
- change app code unless explicitly assigned as a coding agent

### Content QA Agent

Owns generated content validation.

Checks:

- schema validity
- answer key correctness
- plausible difficulty
- TOEFL-like task alignment
- duplicate/similarity risk
- ambiguous questions
- unsafe or inappropriate topics
- audio script quality

### Study Strategy Agent

Owns extraction of reusable TOEFL strategies from approved sources such as Andrew's Comprehensive TOEFL Study Guide 2.0, coach notes, beta-user reviews, and internal rubrics.

Allowed:

- summarize strategy logic into original, concise strategy cards
- create answer cues, note templates, and response scaffolds
- map strategies to TOEFL section/task/question types
- create practice drill blueprints from strategies
- maintain `STRATEGY_CARD_CATALOG.md` as the human-readable source of truth for initial strategy behavior

Not allowed:

- copy long passages from third-party guides into the app
- publish source text without rights
- convert unofficial strategies into claims of official ETS scoring
- generate learner-facing advice that conflicts with the current TOEFL format without review

### Scoring Evaluation Agent

Owns feedback quality and score consistency.

Checks:

- rubric adherence
- scoring stability across model versions
- bias and harshness patterns
- hallucinated advice
- cost per scoring run
- whether feedback maps to the correct strategy card and next drill

## Coordination Workflow

### 1. Feature Intake

Every feature starts with:

- problem
- user role
- route or module affected
- data model impact
- AI/model impact
- first-user onboarding impact
- cost/token impact
- existing asset or flow to reuse
- acceptance tests
- rollout flag

### 2. Implementation

Agents should use separate branches or clearly scoped changes. A change touching frontend, backend, and generation should be split by contract:

1. Backend defines schema/API contract.
2. Frontend integrates against the contract.
3. Generation subagent emits content matching the contract.
4. QA validates generated content and product flow.
5. Study Strategy Agent maps content and mistakes to strategy cards and answer cues.

### 3. Handoff Format

Use this handoff note when one agent passes work to another:

```md
## Handoff

Task:
Files changed:
Contracts changed:
Migrations:
Feature flags:
Tests run:
Known risks:
Next owner:
```

### 4. Content Generation Job Lifecycle

Statuses:

- `requested`
- `generating`
- `generated`
- `auto_check_failed`
- `auto_checked`
- `human_review_required`
- `approved`
- `published_beta`
- `published_production`
- `retired`

Only `approved`, `published_beta`, and `published_production` content can appear in learner-facing test forms.

### 4B. Seed-First Content Workflow

Use this workflow before full generation:

1. Import existing mini mockups and practice cards as seed content.
2. Tag each item with section, task type, question type, difficulty, timing, traps, strategy card, cue, explanation, and repair rule.
3. Validate answer keys and ambiguity.
4. Mark reviewed seed content as approved.
5. Generate only missing variants, distractors, explanations, speaking/writing prompts, and repair drills.
6. Assemble section mockups from approved mini mockups.
7. Assemble full mock tests only from approved content pools.

Full mock generation from scratch is a later-stage tool, not a first-user-ready feature.

### 4A. Strategy Source Lifecycle

Statuses:

- `submitted`
- `extracting`
- `extracted`
- `qa_required`
- `approved_for_internal_logic`
- `approved_for_learner_cues`
- `retired`

Rules:

- Strategy sources produce transformed strategy cards, not copied public lessons.
- Each strategy card must point to its source and extractor.
- Cues must be short, original, and action-oriented.
- Templates must be stored as scaffolds with variable slots, not as one rigid answer users blindly memorize.
- Any source with unclear rights can be used for internal product thinking only until approved.
- Changes to learner-facing strategy behavior should update `STRATEGY_CARD_CATALOG.md` before implementation tickets are created.

### 5. Pull Request Checklist

For code changes:

- no scattered direct model calls
- no unversioned prompts
- no raw generated content in UI
- no user data sent to models unless required
- migrations are reversible or documented
- tests cover the changed behavior
- analytics events added for major user actions
- loading, empty, error, and retry states exist
- guided-practice cues are hidden in mock-test mode
- strategy cards and cue text are versioned when behavior changes

For content changes:

- source/provenance recorded
- answer key validated
- generated content similarity checked
- task type and difficulty tagged
- reviewer approval recorded
- beta/prod availability set intentionally
- associated strategy card is attached when relevant
- hints do not reveal the answer directly
- generated repair drills target the recorded mistake taxonomy

## Token-Saving Standards

Agents must use these patterns in production code:

- cache stable generated explanations by content version
- cache scoring by response hash where allowed
- summarize old attempts before personalization
- avoid sending full user history to a model
- keep prompts short and schema-driven
- use deterministic tools before AI
- log token usage and feature owner
- fail closed when monthly budget is exceeded
- generate strategy cards once per source/version, then reuse them across many exercises
- render static cues from database instead of asking a model for live hints
- generate repair drills from compact mistake labels instead of full attempt transcripts

## Release Gates

Beta release can ship when:

- learners can complete onboarding, one diagnostic or mini mock, review, and one recommended next drill
- progress saves locally for guests and to Convex for signed-in users
- first-user flow has no unnecessary detours, placeholders, or unvalidated content
- learners can complete at least one section practice and one daily drill
- generated content is behind review or beta flag
- attempts and responses persist reliably
- writing or speaking feedback has clear "estimated practice" labeling
- AI spend is logged
- at least one strategy-driven guided drill exists for the highest-priority beta weakness; one per major section can follow after first-user readiness
- mock-test mode disables answer-time cues

Production release can ship when:

- full mock tests work end to end
- generated test approval workflow is active
- scoring eval set passes
- recording retention policy is implemented
- frontend passes desktop and mobile QA
- monitoring alerts are configured
- strategy cards are reviewed, versioned, and connected to feedback and drill generation
- source provenance is visible in admin tooling

## Working With Missing App Source

When the app repo becomes available, first agent should run:

```sh
rg --files -g '!*node_modules*' | head -200
find .. -name package.json -o -name pyproject.toml -o -name requirements.txt
git status --short
```

Then update these docs with:

- actual framework
- actual routes
- actual database
- actual AI provider calls
- current test-generation path
- current frontend weaknesses
- exact refactor tickets
