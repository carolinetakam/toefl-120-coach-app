# TOEFL Coach App Architecture

Date: 2026-06-02

Status: production refactor plan based on the inspected app at `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`. The current app is a lean Next.js, Clerk, and Convex beta product with onboarding, diagnostics, practice cards, mini mockups, review, error logging, and cloud sync. This document defines how to evolve that app without rebuilding from scratch.

## Product Direction

Build a TOEFL coach that feels closer to a test simulator plus personal tutor than a content library. The 80/20 product goal is:

1. Give learners TOEFL-like practice every day.
2. Use existing mini mockups and practice cards as seed content.
3. Tag, enrich, and validate seed content before generating anything new.
4. Generate only missing variants, distractors, explanations, prompts, and repair drills.
5. Score and explain weak points with deterministic logic first and low-cost AI only where it creates clear value.
6. Refactor the frontend around taking practice, reviewing mistakes, and knowing the exact next drill.

First user-ready app constraint: do not add unnecessary features before the test-user onboarding loop is complete. The first loop is profile -> diagnostic or mini mock -> review -> exact next drill -> saved progress.

ETS now lists TOEFL iBT sections as Reading, Listening, Writing, and Speaking with task types including Complete the Words, Read in Daily Life, Read an Academic Passage, Listen and Choose a Response, Listen to a Conversation, Listen to an Announcement, Listen to an Academic Talk, Build a Sentence, Write an Email, Write for an Academic Discussion, Listen and Repeat, and Take an Interview. ETS also states Reading and Listening are adaptive, while Writing and Speaking include AI-scored constructed responses. Sources are listed at the end.

## Core Architecture

Use a modular monolith first unless current traffic already demands distributed services. It is cheaper, easier to ship, and easier for agents to coordinate. Keep boundaries clean enough that the test generation worker and scoring worker can move out later.

Recommended runtime:

- Frontend: Next.js or existing framework, with a test-taking shell optimized for timed interactions.
- API/backend: use existing Convex and Next.js routes first; add typed contracts, validation, and rate limits where needed.
- Database: use Convex for the current beta; introduce Postgres only if scale, reporting, or platform needs justify the migration.
- Object storage: defer durable audio/report storage until recording retention and speaking feedback are required for paid/broader beta.
- Queue: defer heavy queues until generation/scoring jobs are real; simple admin-driven jobs are enough for first release.
- Cache: start with content version hashes, response hashes, and persisted generated outputs; Redis is optional later.
- AI gateway: one internal service/module that all model calls pass through for cost control, prompt versioning, logging, and fallbacks.

## Domain Modules

### 1. Auth and User Profile

Owns sign-in, roles, target score, exam date, native language, timezone, accessibility preferences, and consent for recording analysis.

Roles:

- learner
- teacher/coach
- content reviewer
- admin
- agent

### 2. Test Content Bank

Owns TOEFL-like content, metadata, versions, review status, and licensing provenance.

Every generated item must have:

- `skill`: reading, listening, writing, speaking
- `task_type`: one official-like task pattern
- `difficulty_band`: A1-C2 or internal 1-6 band estimate
- `source_type`: generated, human-authored, licensed, public-domain, user-created
- `generation_prompt_version`
- `review_status`: draft, auto_checked, human_review_required, approved, retired
- `quality_flags`: plagiarism_risk, too_easy, too_hard, ambiguous_answer, audio_issue, rubric_mismatch

Do not put unreviewed generated content directly into production tests. It can appear in beta only behind a clear `experimental` flag and analytics tracking.

80/20 implementation: migrate the current static `practiceCards` and `mockTests` into approved seed content or a typed content registry before creating a large content platform.

### 2A. Strategy and Cue Library

Owns reusable TOEFL prep logic extracted from study guides, coach notes, beta learner outcomes, and approved internal rubrics. Andrew's Comprehensive TOEFL Study Guide 2.0 should be treated as a strategy source, not as raw content to copy into the app.

The guide's useful product logic is:

- section-specific strategy: Reading, Listening, Speaking, Writing
- question-type strategy: vocabulary, factual, negative factual, inference, author purpose, sentence rephrasing, sentence insertion, summary, campus conversation, academic lecture, independent speaking, integrated speaking, integrated writing, academic discussion
- answer process: what to inspect first, what to ignore, what to match, what to write/say, what to check before submitting
- note-taking formats for reading, listening, speaking, and writing tasks
- reusable speaking and writing response scaffolds
- pacing checkpoints and time allocation
- self-review loops using recording playback, clarity, cadence, pronunciation, confidence, and template fluency

Represent this as structured strategy cards:

- `strategy_source`: URL, title, owner, license/provenance, extraction status
- `strategy_card`: section, task type, question type, learner level, tactic name, tactic summary, trigger condition, steps, common traps, cue text, example-safe paraphrase
- `answer_cue`: short in-test hint tied to a specific question type and learner state
- `note_template`: fields the learner should fill while reading/listening
- `response_template`: structured speaking/writing scaffold
- `practice_drill_blueprint`: interactive exercise generated from a strategy card

The initial implementation catalog lives in `STRATEGY_CARD_CATALOG.md`. That file should be the seed source for guided drills, mock-test review explanations, subagent generation constraints, and mistake repair rules.

Do not reproduce the guide as a public content page unless rights are confirmed. The production app should use transformed strategy logic, short paraphrased cues, and original generated exercises.

### 3. Test Builder

Assembles practice from the content bank.

Modes:

- Daily drill: 5-12 minutes, one weak skill.
- Section practice: one full section or focused task type.
- Full mock: TOEFL-like timing and section order.
- Adaptive practice: router questions choose easier/harder module for Reading and Listening.
- Coach assignment: teacher or agent assigns a specific practice set.
- Strategy drill: one question type with guided cues, then unguided repetition.
- Template rehearsal: speaking/writing practice where the user fills a scaffold, records or writes, then receives structure feedback.
- Mistake repair: generated micro-exercises based on the learner's previous wrong-answer pattern.

The builder should freeze a `test_form_version` when a user starts, so later content edits do not mutate historical attempts.

For the first user-ready app, build this from existing mini mockups before full mock tests. Full mock tests should be assembled only after mini mockups and section mockups persist reliably.

### 4. Test Session Engine

Owns timers, navigation rules, autosave, answer capture, resume behavior, accommodations, and anti-loss protection.

Production requirements:

- autosave every answer change and every 5-10 seconds during writing
- upload speaking recordings in chunks or immediately after recording ends when durable speaking feedback is enabled; local playback is acceptable for early test-user self-review if clearly scoped
- idempotent submission endpoint
- server-authoritative timer with client display for full mock or paid exam simulation; simple persisted timers are acceptable for first mini mockup release
- no answer reveal before submission
- accessibility support for keyboard navigation, transcripts where appropriate for practice, and screen reader labels

### 5. Scoring and Feedback

Use deterministic scoring first where possible:

- multiple choice and gap tasks: exact/rule-based scoring
- sentence building: normalized token/grammar pattern scoring plus accepted variants
- reading/listening explanations: generated once per item version, cached
- writing/speaking: rubric-based AI scoring with sampling, calibration, and cost ceilings

For first-user readiness, keep writing and speaking feedback modest if AI scoring is not yet wired. Use checklists, word counts, stored structure cues, and honest "practice estimate" language.

For writing and speaking, return:

- estimated band
- rubric dimensions
- top 3 improvement priorities
- one revised example answer
- exact next drill recommendation

Do not claim official ETS scoring. Use language like "estimated practice band" and show confidence where possible.

Feedback should also map each mistake to a strategy card:

- Reading factual miss: did not match question words to text synonyms
- Reading negative factual miss: did not eliminate the three true choices first
- Reading inference miss: chose a fact or overreach instead of the closest supported implication
- Reading summary miss: chose a detail instead of a paragraph-level main idea
- Listening miss: notes missed speaker attitude, purpose, contrast, or example structure
- Speaking miss: weak template control, unclear enunciation, missing reasons/examples, or poor pacing
- Writing miss: weak reading-listening contrast, insufficient listening detail, missing discussion stance, or weak example

This creates a coaching loop: attempt -> mistake taxonomy -> strategy card -> next generated drill.

### 6. AI Gateway

All model calls, once added, go through one gateway with:

- prompt templates stored in versioned files or database records
- per-feature budgets
- cache keys by user/task/content/prompt version
- model routing by complexity
- JSON schema validation
- retry limits
- redaction of sensitive user data
- evaluation samples for regression testing

Suggested model routing:

- cheap/small model: classification, CEFR estimate, typo cleanup, item tagging
- medium model: feedback summaries, distractor generation, hint generation
- strong model: writing/speaking rubric scoring, full test generation, content QA
- non-AI: exact answer checks, metrics, scheduling, deterministic recommendations

Do not add live model calls just because the architecture supports them. First use stored strategy cards, deterministic scoring, cached explanations, and compact enrichment jobs.

### 7. Subagent Test Generation

The subagent does not write directly to production tables. It creates `test_generation_jobs` and `content_drafts`, then a validator promotes approved content.

If the current app already has mini mockups, the agent should not start by generating full mock tests. The efficient strategy is:

1. Import existing mini mockups as reviewed seed content.
2. Tag each mini mockup by section, task type, strategy card, difficulty, timing, and mistake taxonomy.
3. Generate only missing variants, distractors, explanations, cues, and repair drills.
4. Assemble larger section tests from approved mini mockups and approved generated variants.
5. Build full mock tests only from approved content pools, not raw one-shot generation.

This keeps AI cost low, improves quality, and lets beta users train immediately without waiting for a large generated test bank.

Pipeline:

1. Product/backend creates a generation job with target section, task type, difficulty, topic, quantity, and constraints.
2. Subagent generates structured content only, matching the schema.
3. Automated validator checks format, answer keys, word counts, timing, duplicate similarity, topic safety, and rubric alignment.
4. Optional audio job creates listening/speaking audio from approved scripts.
5. Reviewer or trusted auto-policy approves content.
6. Test builder can include approved items in beta or production pools.

Hard rule: the app should never render raw subagent output. Render only persisted, schema-valid, versioned content.

### 7A. Mini Mockup Assembly Strategy

Use three levels of practice:

- Mini mockup: 5-12 minutes, one task type or one strategy card.
- Section mockup: assembled from 3-6 approved mini mockups in the same section.
- Full mockup: assembled from approved section mockups with exam-like order, timing, and review lock rules.

Cost-effective generation rules:

- Use the agent to enrich existing mini mockups before creating new ones.
- Generate explanations once per item version and cache them.
- Generate hints/cues from strategy cards, not from live model calls.
- Use deterministic scoring for objective mini mockups.
- Use AI scoring only for speaking and writing attempts, with response-hash caching.
- Prefer repair drills over new full tests when a learner misses a pattern.

The test builder should support `assembly_source`:

- `existing_mini_mockup`
- `approved_generated_variant`
- `manual_content`
- `licensed_content`

Full mockups should include a `mock_integrity_level`:

- `practice`: cues allowed before or during tasks
- `exam_simulation`: no cues until review
- `diagnostic`: no cues during test, but stronger post-test repair plan

### 8. Strategy-Driven Exercise Generation

Generated exercises should be built from both a TOEFL task schema and a strategy card.

Example generation inputs:

```json
{
  "section": "reading",
  "taskType": "read_academic_passage",
  "questionType": "negative_factual",
  "strategyCard": "eliminate-three-true-choices",
  "difficultyBand": "B2",
  "exerciseMode": "guided",
  "cuePolicy": "show-before-answer",
  "quantity": 4
}
```

Exercise modes:

- `guided`: show a concise cue before answering.
- `hinted`: hide cue behind a hint button.
- `exam`: no cues during answering; show strategy after submission.
- `repair`: generated from a previous mistake pattern.
- `template_rehearsal`: scaffolded speaking/writing answer practice.
- `mini_mockup`: short exam-like set assembled from existing or approved content.
- `section_mockup`: section-length set assembled from approved mini mockups.

Cue examples should be short and action-oriented:

- Reading factual: "Rephrase the question, then find synonym matches in the paragraph."
- Reading negative factual: "Find the three choices that are stated; the leftover choice is the answer."
- Reading summary: "Pick broad paragraph-level ideas, not details."
- Speaking independent: "State your opinion, give two reasons, then attach one concrete example to each."
- Integrated writing: "Spend more detail on the lecture than the reading; show how the lecture challenges each point."

The app should adapt cue visibility:

- new learner or repeated miss: show cue before answer
- improving learner: hint button only
- mock test: no cue until review
- review room: show the strategy card and a generated repair drill

## Data Model

Minimum tables:

- `users`
- `learner_profiles`
- `content_items`
- `content_item_versions`
- `content_assets`
- `test_forms`
- `test_form_items`
- `test_attempts`
- `test_responses`
- `scoring_runs`
- `feedback_reports`
- `generation_jobs`
- `generation_artifacts`
- `agent_runs`
- `prompt_versions`
- `model_usage_events`
- `subscriptions`
- `coach_assignments`
- `strategy_sources`
- `strategy_cards`
- `answer_cues`
- `note_templates`
- `response_templates`
- `exercise_blueprints`
- `mistake_taxonomy`

Important fields:

- `content_item_versions.content_hash` for duplicate detection
- `test_attempts.form_version_id` for immutable attempts
- `scoring_runs.model`, `prompt_version`, `input_tokens`, `output_tokens`, `cost_estimate`
- `generation_jobs.status`, `requested_by`, `approved_by`, `failure_reason`
- `agent_runs.trace_id` for debugging subagent behavior
- `strategy_cards.source_id`, `section`, `task_type`, `question_type`, `trigger_condition`, `steps`, `cue_text`
- `exercise_blueprints.strategy_card_id`, `mode`, `difficulty_band`, `validation_rules`

## API Contracts

Core endpoints:

- `POST /api/test-forms/build`
- `GET /api/test-forms/:id`
- `POST /api/attempts`
- `PATCH /api/attempts/:id/responses`
- `POST /api/attempts/:id/submit`
- `POST /api/attempts/:id/recordings`
- `GET /api/attempts/:id/report`
- `POST /api/generation-jobs`
- `GET /api/generation-jobs/:id`
- `POST /api/admin/content/:id/approve`
- `GET /api/strategy-cards`
- `POST /api/admin/strategy-sources/import`
- `POST /api/exercises/build`
- `GET /api/attempts/:id/next-drills`

Generation job request shape:

```json
{
  "section": "reading",
  "taskType": "read_academic_passage",
  "difficultyBand": "B2",
  "quantity": 5,
  "topicConstraints": ["campus life", "biology", "history"],
  "avoidTopics": ["politics", "medical advice"],
  "targetFormatVersion": "toefl-2026-v1",
  "betaOnly": true
}
```

Generated content response shape:

```json
{
  "formatVersion": "toefl-2026-v1",
  "items": [
    {
      "skill": "reading",
      "taskType": "read_academic_passage",
      "questionType": "inference",
      "strategyCardId": "reading-inference-supported-implication",
      "difficultyBand": "B2",
      "stimulus": {},
      "questions": [],
      "answerKey": {},
      "rubric": {},
      "answerCues": [],
      "timingSeconds": 480,
      "rationale": "Generated for B2 academic reading inference practice."
    }
  ]
}
```

## Frontend Refactor Architecture

The frontend should be refactored around three primary surfaces. Preserve working current flows and replace only what blocks first-user readiness:

1. Practice dashboard: target score, exam date, weak skills, next action, streak, recent attempts.
2. Test player: full-screen, low-distraction, timed, accessible, resilient to refresh.
3. Review room: answer-by-answer review, audio playback, transcript, rubric, mistakes, next drills.

Component groups:

- `TestShell`
- `SectionTimer`
- `QuestionRenderer`
- `AudioPlayer`
- `Recorder`
- `WritingEditor`
- `AnswerReview`
- `ScoreBand`
- `SkillRadar`
- `NextPracticeQueue`
- `ContentAdmin`
- `CuePanel`
- `HintButton`
- `NoteTemplate`
- `TemplateRehearsal`
- `MistakeMap`
- `RepairDrillLauncher`

UI rules:

- Avoid a marketing-style dashboard. Learners need scan-fast operational clarity.
- Make the next best action obvious above the fold.
- Keep test-taking controls stable and predictable across sections.
- Treat mobile as daily drill first; full mocks should strongly recommend tablet/desktop.
- Preserve accessibility: keyboard navigation, visible focus, clear labels, transcript availability for practice review.
- In guided practice, cues should be visible but compact. In mock tests, cues must be hidden until review.
- The review room should explain the missed strategy, then launch a short repair drill from the same strategy card.

## Token and Cost Control

Highest-impact cost rules:

1. Never rescore unchanged responses. Cache by response hash, prompt version, rubric version, and model.
2. Generate explanations per content item, not per user, unless personalized feedback is required.
3. Use deterministic scoring for objective questions.
4. Batch feedback after test submission instead of generating on every answer.
5. Store structured feedback and render from database.
6. Use small models for classification and routing.
7. Use stronger models only for final writing/speaking feedback and content generation QA.
8. Put hard monthly and per-user AI budgets in the gateway.
9. Summarize long attempt history before sending it to a model.
10. Log model usage by feature, user, and prompt version.

Production budget metrics:

- AI cost per active learner per month
- AI cost per completed attempt
- scoring cost by section
- generation cost per approved item
- cache hit rate
- percentage of feedback served from cache

## Quality, Safety, and Compliance

Risks:

- generated content accidentally copies copyrighted prep material
- learners mistake estimated scores for official scores
- speaking recordings create privacy obligations
- model feedback is inconsistent or discouraging
- low-quality generated tests damage trust

Controls:

- provenance metadata on every content item
- similarity check before approval
- clear "practice estimate, not official ETS score" labeling
- retention policy for recordings
- human review queue for beta content
- evaluation set for scoring consistency
- audit log for admin and agent actions

## Observability

Track:

- attempt start to completion rate
- abandonment by section and question
- scoring latency
- recording upload failures
- generated content approval rate
- item difficulty drift
- user improvement by skill over time
- refund/support reasons
- AI spend by feature

Minimum alerts:

- scoring job failure spike
- generation validator failure spike
- recording upload error spike
- AI spend exceeds daily budget
- test attempt submission errors

## Refactor Sequence

Phase 1: stabilize product core

- finish first-user onboarding loop
- convert existing mini mockup into an immutable attempt model
- tag and enrich existing seed content
- add objective scoring and cached explanations where needed
- inventory AI needs; add AI gateway only before the first model call

Phase 2: add seed-first content expansion

- implement seed content registry or content table
- implement mini mockup and section mockup assembly from approved seed content
- add repair drill rules from strategy cards
- implement constrained subagent generation only for missing variants, distractors, explanations, prompts, and repair drills
- implement validators
- create lightweight reviewer/admin approval path only if manual files are no longer enough
- expose generated variants behind beta flag
- log quality and learner performance
- add strategy-source import for Andrew-style TOEFL strategy
- generate guided drills from approved strategy cards

Phase 3: strategy and frontend refinement

- build test player first
- build review room second
- build dashboard third
- build guided cue and template rehearsal components
- migrate old pages behind redirects
- run mobile/desktop visual QA

Phase 4: production hardening

- add spend limits, abuse limits, and retention policy
- add scoring eval set
- add monitoring and support tools
- add exportable progress reports for learners and coaches

## Market Enhancement Opportunities

Most TOEFL prep products compete on question volume, mock tests, videos, and generic AI feedback. A stronger beta can differentiate with:

- test generation that refreshes content while keeping quality gates
- adaptive weak-skill practice tied to actual attempt history
- speaking recording playback with timeline comments
- writing feedback that separates grammar, structure, task fulfillment, and academic tone
- "why I missed it" mistake taxonomy for Reading/Listening
- short daily practice that still maps to full TOEFL task types
- coach mode for assigning tests and reviewing progress
- score confidence and readiness date, not only raw practice scores
- bilingual onboarding and feedback for Korean learners if Korea is a target market
- low-cost plan that uses objective practice heavily and reserves AI for high-value speaking/writing moments
- strategy-aware exercises where every item teaches a repeatable answering move
- answer-time cues that fade as the learner improves
- template rehearsal for speaking/writing with recording, playback, and structure feedback
- note-taking trainers for campus conversations, lectures, integrated speaking, and integrated writing
- mistake repair drills generated immediately from the learner's last attempt

## Source Notes

- ETS TOEFL test content page, accessed 2026-06-02: https://www.ets.org/toefl/test-takers/ibt/about/content.html
- ETS TOEFL iBT 2026 specification PDF, accessed 2026-06-02: https://www.eu.ets.org/pdfs/toefl/toefl-ibt-test-specifications-2026.pdf
- ETS TOEFL TestReady announcement, accessed 2026-06-02: https://www.ets.org/news/press-releases/introducing-toefl-testready-new-era-test-preparation.html
- Andrew's Comprehensive TOEFL Study Guide 2.0, accessed through user-provided Notion URL on 2026-06-02: https://icy-petalite-beb.notion.site/Andrew-s-Comprehensive-TOEFL-Study-Guide-2-0-259a865119258097bfb2fd7ac1c11856
