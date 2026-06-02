# TOEFL Strategy Card Catalog

Date: 2026-06-02

Purpose: convert Andrew's Comprehensive TOEFL Study Guide 2.0, official TOEFL task structure, and high-yield test-taking practice into implementable strategy cards for guided exercises, mock-test review, repair drills, and subagent content generation.

This catalog should be used as product logic, not copied lesson content. Learner-facing cues must be short, original, and tied to the exact task state.

## 80/20 Strategy

The app should prioritize the tactics that most often change outcomes:

1. Reading: rephrase the question, match synonyms, eliminate traps, protect pace.
2. Listening: listen for purpose, attitude, transitions, examples, and the second speaker's stance.
3. Speaking: use stable templates, answer quickly, give reasons/examples, record and review delivery.
4. Writing: use clear structure, prioritize lecture details in integrated writing, take a stance in discussion writing.
5. Review: every mistake should create one repair drill, not a generic recommendation.

## Card Schema

Each card should map to database fields:

- `id`
- `section`
- `task_type`
- `question_type`
- `priority`: P0, P1, P2
- `when_to_show`: guided_before_answer, hint_button, review_only, template_rehearsal
- `cue`
- `steps`
- `common_traps`
- `drill_blueprint`
- `scoring_signal`
- `repair_rule`

## Reading Cards

### R-001 Sequential Solve

- `section`: Reading
- `question_type`: passage workflow
- `priority`: P0
- `when_to_show`: guided_before_answer
- `cue`: "Skim title and topic sentences, then solve in order. Do not read answer choices before you know what to find."
- `steps`: read title; read first sentence of each paragraph; open question; locate relevant paragraph; answer from evidence.
- `common_traps`: reading the whole passage slowly; reading all choices first; losing time on one paragraph.
- `drill_blueprint`: show a passage and ask learner to identify which paragraph likely contains each answer before answering.
- `scoring_signal`: time per question and paragraph lookup accuracy.
- `repair_rule`: if learner spends too long before first answer, assign paragraph-location drill.

### R-002 Rephrase Question

- `section`: Reading
- `question_type`: factual, inference, purpose
- `priority`: P0
- `cue`: "Rewrite the question in plain words before looking at choices."
- `steps`: remove extra wording; identify subject, action, and requested reason/result; search for that meaning.
- `common_traps`: chasing exact wording; answering a different question; over-reading academic phrasing.
- `drill_blueprint`: give complex question stems and ask learner to choose the best simple rewrite.
- `scoring_signal`: rewrite accuracy before answer.
- `repair_rule`: if wrong answer contradicts question target, assign rephrase drill.

### R-003 Synonym Match

- `section`: Reading
- `question_type`: factual, vocabulary, sentence rephrasing
- `priority`: P0
- `cue`: "The answer usually restates the passage. Match meaning, not exact words."
- `steps`: mark keywords in question; find synonyms or paraphrases in passage; compare answer choices to the same idea.
- `common_traps`: rejecting correct answers because wording changed; choosing repeated words that change meaning.
- `drill_blueprint`: match question words to passage synonyms, then answer.
- `scoring_signal`: selected evidence sentence contains semantic match.
- `repair_rule`: if chosen answer repeats a keyword but changes meaning, assign synonym-vs-trap drill.

### R-004 Vocabulary Fast Answer

- `section`: Reading
- `question_type`: vocabulary
- `priority`: P1
- `cue`: "If you know the word, answer fast. Use context only when uncertain."
- `steps`: choose known meaning; if uncertain, test each option in sentence; eliminate tone or part-of-speech mismatches.
- `common_traps`: overusing context on easy words; choosing a nearby but wrong connotation.
- `drill_blueprint`: timed vocabulary replacement with optional context reveal.
- `scoring_signal`: accuracy and time under target.
- `repair_rule`: if vocabulary time is high, assign fast-answer vocab drill.

### R-005 Factual Evidence Match

- `section`: Reading
- `question_type`: factual
- `priority`: P0
- `cue`: "Find the subject in the paragraph, then match the reason or result stated near it."
- `steps`: rephrase question; locate subject; scan for cause/result words; match evidence to choice.
- `common_traps`: using outside logic; choosing a true sentence that does not answer the question.
- `drill_blueprint`: highlight evidence sentence before selecting an answer.
- `scoring_signal`: evidence selection agrees with answer.
- `repair_rule`: if evidence missing or unrelated, assign evidence-first factual drill.

### R-006 Negative Factual Elimination

- `section`: Reading
- `question_type`: negative factual
- `priority`: P0
- `cue`: "Find the three stated choices. The remaining unstated choice is the answer."
- `steps`: mark EXCEPT/NOT; scan paragraph; eliminate three supported choices; select leftover.
- `common_traps`: selecting a true statement; forgetting the question is negative; using memory instead of text.
- `drill_blueprint`: force learner to cross out three supported statements before final answer.
- `scoring_signal`: eliminated choices all have evidence.
- `repair_rule`: if learner selects a supported statement, assign negative-factual elimination drill.

### R-007 Purpose Function

- `section`: Reading
- `question_type`: author purpose
- `priority`: P1
- `cue`: "Ask why this detail is here. It usually supports, contrasts, defines, or gives an example."
- `steps`: locate mentioned detail; read before and after; identify relationship to main point.
- `common_traps`: explaining what the detail says instead of why it appears.
- `drill_blueprint`: classify detail function: support, contrast, example, definition, concession.
- `scoring_signal`: relationship classification accuracy.
- `repair_rule`: if learner chooses content summary, assign function-classification drill.

### R-008 Supported Inference

- `section`: Reading
- `question_type`: inference
- `priority`: P0
- `cue`: "Infer only one small step from evidence. Avoid answers that go beyond the passage."
- `steps`: locate evidence; state what must be true; eliminate choices with new claims or extreme wording.
- `common_traps`: choosing outside common sense; choosing an answer that is too broad; treating inference like opinion.
- `drill_blueprint`: choose which inference is supported by a short evidence sentence.
- `scoring_signal`: answer is supported by specific evidence and does not introduce unsupported facts.
- `repair_rule`: if chosen answer adds new information, assign overreach drill.

### R-009 Sentence Rephrasing Meaning Preservation

- `section`: Reading
- `question_type`: sentence rephrasing
- `priority`: P1
- `cue`: "Keep all key ideas and their relationship. Reject choices that add, remove, or reverse meaning."
- `steps`: split original sentence into idea units; identify contrast/cause/time relationship; match all units to answer.
- `common_traps`: answer is partly true but misses one idea; order or relationship is reversed.
- `drill_blueprint`: break sentence into idea chips and match to paraphrase.
- `scoring_signal`: selected answer preserves all idea units.
- `repair_rule`: if learner chooses partial answer, assign idea-unit drill.

### R-010 Sentence Insertion Cohesion

- `section`: Reading
- `question_type`: sentence insertion
- `priority`: P1
- `cue`: "Use pronouns, transition words, and new-vs-known ideas to place the sentence."
- `steps`: identify pronouns/demonstratives; find antecedent; check transition; test flow before and after.
- `common_traps`: placing sentence before the noun it refers to; ignoring consequence/contrast words.
- `drill_blueprint`: insert sentence into four slots and explain pronoun/transition evidence.
- `scoring_signal`: placement has valid before-and-after cohesion.
- `repair_rule`: if placement breaks pronoun reference, assign cohesion drill.

### R-011 Summary Big Ideas

- `section`: Reading
- `question_type`: summary
- `priority`: P0
- `cue`: "Pick broad main ideas from different paragraphs. Reject narrow details."
- `steps`: read topic sentence; eliminate unrelated choices; eliminate details; select distinct paragraph-level ideas.
- `common_traps`: choosing a true detail; choosing duplicate ideas; choosing a choice not tied to summary sentence.
- `drill_blueprint`: classify choices as main idea, detail, unrelated, or duplicate.
- `scoring_signal`: selected choices cover distinct paragraph topics.
- `repair_rule`: if selected choice is detail-level, assign main-idea-vs-detail drill.

## Listening Cards

### L-001 Active Listening Balance

- `section`: Listening
- `question_type`: workflow
- `priority`: P0
- `cue`: "Listen first, note only useful structure: purpose, problem, reasons, examples, attitude, transitions."
- `steps`: write sparse labels; avoid full sentences; keep eyes still; track speaker roles.
- `common_traps`: writing too much; missing the next sentence; treating every detail equally.
- `drill_blueprint`: play short audio and ask learner to produce a must/should/could note set.
- `scoring_signal`: notes contain high-value fields without excessive transcription.
- `repair_rule`: if notes are long but answer accuracy low, assign active-listening note drill.

### L-002 Gist First

- `section`: Listening
- `question_type`: gist-content, gist-purpose
- `priority`: P0
- `cue`: "First question usually asks main idea or why the speaker is talking."
- `steps`: identify setting; identify speaker goal; separate topic from purpose.
- `common_traps`: choosing a detail as the main idea; confusing topic with reason for conversation.
- `drill_blueprint`: listen to opening 30 seconds and choose topic vs purpose.
- `scoring_signal`: gist answer correct before detail questions.
- `repair_rule`: if gist miss, assign opening-purpose drill.

### L-003 Second Speaker Clue

- `section`: Listening
- `question_type`: campus conversation
- `priority`: P0
- `cue`: "In conversations, the second speaker often reveals the problem, opinion, or solution."
- `steps`: tag speaker roles; capture second speaker stance; note proposed next action.
- `common_traps`: focusing only on the student; missing adviser/professor response.
- `drill_blueprint`: identify which speaker gives the answer clue.
- `scoring_signal`: notes include second speaker stance/action.
- `repair_rule`: if conversation detail missed, assign speaker-role drill.

### L-004 Transition Words

- `section`: Listening
- `question_type`: organization, detail, inference
- `priority`: P0
- `cue`: "Transitions signal answer zones: however, for example, because, first, finally, surprisingly."
- `steps`: mark transition; predict relationship; listen for example, contrast, cause, or conclusion.
- `common_traps`: missing contrast; treating examples as main points.
- `drill_blueprint`: play clips and classify transition function.
- `scoring_signal`: learner identifies relationship after transition.
- `repair_rule`: if missed organization/detail after contrast, assign transition drill.

### L-005 Important vs Seemingly Important Detail

- `section`: Listening
- `question_type`: detail
- `priority`: P1
- `cue`: "Important details explain the main point, problem, reason, example, or decision."
- `steps`: ask whether detail changes purpose or supports main idea; ignore isolated names/numbers unless emphasized.
- `common_traps`: memorizing random facts; missing repeated or stressed details.
- `drill_blueprint`: sort details into tested vs unlikely-to-test.
- `scoring_signal`: chosen notes align with question targets.
- `repair_rule`: if notes include many untested facts, assign detail-priority drill.

### L-006 Speaker Attitude and Function

- `section`: Listening
- `question_type`: attitude, function
- `priority`: P0
- `cue`: "Listen for tone and reason behind the sentence, not just the words."
- `steps`: detect surprise, doubt, agreement, correction, concern; ask why speaker said it.
- `common_traps`: literal interpretation; ignoring intonation.
- `drill_blueprint`: replay one sentence and choose function or attitude.
- `scoring_signal`: function/attitude classification accuracy.
- `repair_rule`: if literal trap chosen, assign replay-function drill.

### L-007 Organization Map

- `section`: Listening
- `question_type`: organization
- `priority`: P1
- `cue`: "Lectures usually move through topic, definition, examples, contrast, cause/effect, or chronology."
- `steps`: identify lecture frame; label examples; note comparison or sequence.
- `common_traps`: mixing example order; missing general-to-specific movement.
- `drill_blueprint`: drag lecture notes into organization map.
- `scoring_signal`: map matches audio order and relation.
- `repair_rule`: if organization miss, assign map-building drill.

## Speaking Cards

### S-001 Delivery Is Score-Relevant

- `section`: Speaking
- `question_type`: all speaking
- `priority`: P0
- `cue`: "Speak clearly, steadily, and loud enough. Perfect accent is not required; understandable delivery is."
- `steps`: open mouth; keep steady pace; reduce filler; finish complete thought.
- `common_traps`: mumbling; rushing; long pauses; abandoning structure.
- `drill_blueprint`: record 30 seconds, then self-rate clarity, pace, fillers, confidence.
- `scoring_signal`: speech rate, pause count, transcription confidence, completion.
- `repair_rule`: if transcript confidence low or pauses high, assign delivery rehearsal.

### S-002 Template Fluency

- `section`: Speaking
- `question_type`: all speaking
- `priority`: P0
- `cue`: "Use the template to remove friction; spend your brainpower on reasons and examples."
- `steps`: memorize flexible slots; practice aloud; fill only key content words in notes.
- `common_traps`: reading robotically; memorizing an answer instead of a structure.
- `drill_blueprint`: fill template slots from a prompt, then record without seeing full script.
- `scoring_signal`: answer includes required structural moves.
- `repair_rule`: if answer lacks structure, assign template-slot drill.

### S-003 Independent Speaking Opinion

- `section`: Speaking
- `question_type`: question 1
- `priority`: P0
- `cue`: "Choose one side fast. Give two reasons and concrete examples."
- `steps`: pick stance; reason 1 plus example; reason 2 plus example; optional closing.
- `common_traps`: balanced answer; vague reasons; no example; late start.
- `drill_blueprint`: 15-second prep, 45-second answer, structure checklist.
- `scoring_signal`: stance appears in first sentence; two reasons; one or two examples.
- `repair_rule`: if no clear stance, assign rapid-stance drill.

### S-004 Campus Change Integrated Speaking

- `section`: Speaking
- `question_type`: question 2
- `priority`: P0
- `cue`: "Report the change, the speaker's opinion, and two reasons."
- `steps`: reading notes: change, reason 1, reason 2; listening notes: opinion, reason 1, reason 2; speak in that order.
- `common_traps`: giving personal opinion; missing speaker stance; overexplaining reading.
- `drill_blueprint`: fill reading/listening note table, then record 60-second answer.
- `scoring_signal`: includes change, stance, two reasons from listening.
- `repair_rule`: if personal opinion appears, assign report-not-opinion drill.

### S-005 Academic Concept Integrated Speaking

- `section`: Speaking
- `question_type`: question 3
- `priority`: P0
- `cue`: "Define the concept, then explain lecture examples that make it concrete."
- `steps`: reading notes: topic, definition; lecture notes: example 1/details, example 2/details; speak definition then examples.
- `common_traps`: summarizing reading only; missing example details; weak connection to concept.
- `drill_blueprint`: concept-definition-example mapping.
- `scoring_signal`: examples explicitly connect to concept.
- `repair_rule`: if examples disconnected, assign concept-link drill.

### S-006 Academic Lecture Speaking

- `section`: Speaking
- `question_type`: question 4
- `priority`: P0
- `cue`: "Summarize the lecture topic through two main points or examples."
- `steps`: capture topic; example/main point 1 plus details; example/main point 2 plus details; brief close.
- `common_traps`: losing topic; listing details without structure; running out of time.
- `drill_blueprint`: build a two-column lecture note and record 60 seconds.
- `scoring_signal`: two organized points with supporting details.
- `repair_rule`: if answer is unordered, assign two-point lecture drill.

## Writing Cards

### W-001 Integrated Writing Counterpoint

- `section`: Writing
- `question_type`: integrated writing
- `priority`: P0
- `cue`: "The lecture usually challenges the reading. Organize by reading point plus lecture response."
- `steps`: note reading main claim and reasons; note lecture counterpoints; write intro plus 2-3 body paragraphs.
- `common_traps`: writing personal opinion; summarizing reading too much; missing lecture detail.
- `drill_blueprint`: match each reading claim to lecture challenge.
- `scoring_signal`: body paragraphs contain reading point and stronger lecture explanation.
- `repair_rule`: if reading dominates, assign listening-detail expansion drill.

### W-002 Listening Detail Ratio

- `section`: Writing
- `question_type`: integrated writing
- `priority`: P0
- `cue`: "Use the reading as setup; spend more detail on how the lecture responds."
- `steps`: one sentence reading point; two sentences lecture response; repeat for each body.
- `common_traps`: copying reading; vague lecture summary; no contrast language.
- `drill_blueprint`: expand lecture notes into contrast sentences.
- `scoring_signal`: lecture-to-reading sentence ratio and contrast markers.
- `repair_rule`: if lecture details thin, assign lecture-expansion drill.

### W-003 Integrated Writing Edit Pass

- `section`: Writing
- `question_type`: integrated writing
- `priority`: P1
- `cue`: "Leave time to fix clarity, verb tense, transitions, and missing lecture links."
- `steps`: reserve final minutes; scan topic sentences; check each body has reading plus lecture; fix obvious grammar.
- `common_traps`: writing until timer ends; adding new ideas during edit.
- `drill_blueprint`: timed edit of a flawed integrated paragraph.
- `scoring_signal`: fewer unresolved grammar/structure flags.
- `repair_rule`: if final answer has unfinished sentences, assign timed-edit drill.

### W-004 Academic Discussion Stance

- `section`: Writing
- `question_type`: academic discussion
- `priority`: P0
- `cue`: "Take a clear position, add a concrete example, and connect to the discussion."
- `steps`: state position; explain why; acknowledge or build on a student; add example; close with main point.
- `common_traps`: summarizing classmates only; no original contribution; vague example.
- `drill_blueprint`: generate a 120+ word post from stance, example, and peer reference.
- `scoring_signal`: clear stance, discussion connection, concrete support, sufficient length.
- `repair_rule`: if no stance, assign stance-first discussion drill.

### W-005 Concrete Example Generator

- `section`: Writing
- `question_type`: academic discussion, independent support
- `priority`: P1
- `cue`: "Use a specific example. It can be hypothetical if it directly supports your point."
- `steps`: pick person/company/campus/community; describe situation; explain consequence; tie back to claim.
- `common_traps`: abstract claims; examples that do not prove the point.
- `drill_blueprint`: turn a vague reason into a concrete example.
- `scoring_signal`: example contains actor, action, result, and claim link.
- `repair_rule`: if support is generic, assign example-building drill.

## Cross-Section Cards

### X-001 Pace Guard

- `section`: all
- `question_type`: timing
- `priority`: P0
- `cue`: "Protect the clock. Mark, move, and recover instead of getting stuck."
- `steps`: set checkpoint; if stuck, eliminate and choose; continue; review only if time remains.
- `common_traps`: perfectionism on one item; panic after one hard question.
- `drill_blueprint`: timed mixed set with forced move-on prompts.
- `scoring_signal`: completion rate and time distribution.
- `repair_rule`: if slow cluster appears, assign pacing drill.

### X-002 Trap Awareness

- `section`: reading, listening
- `question_type`: objective questions
- `priority`: P0
- `cue`: "Wrong choices are often true-but-wrong, too specific, too broad, reversed, unsupported, or literal traps."
- `steps`: classify each eliminated choice; choose the best supported answer.
- `common_traps`: repeated words; extreme words; outside knowledge.
- `drill_blueprint`: answer-choice trap labeling.
- `scoring_signal`: trap labels match validator.
- `repair_rule`: if same trap repeats, assign trap-specific repair.

### X-003 Confidence-Based Review

- `section`: all
- `question_type`: review behavior
- `priority`: P1
- `cue`: "Review low-confidence answers first. Do not change high-confidence answers without evidence."
- `steps`: mark confidence; revisit low confidence; require evidence before changing.
- `common_traps`: second-guessing correct answers; random changes.
- `drill_blueprint`: confidence marking with post-set calibration.
- `scoring_signal`: confidence accuracy and harmful change rate.
- `repair_rule`: if harmful change rate high, assign evidence-before-change drill.

## Guided UI Rules

- Guided mode: show one cue and one action, not a paragraph of instruction.
- Hint mode: hide the cue until requested and log hint usage.
- Mock mode: hide all cues until review.
- Review mode: show the missed card, evidence, trap type, and one repair drill.
- Template rehearsal: show scaffold slots first, then gradually remove visible scaffolds.
- Daily drill: cap at 5-12 minutes and target one strategy only.

## Subagent Generation Rules

Subagent prompts should request:

- target card id
- task type
- difficulty
- source mode: enrich_existing_mini_mockup, generate_variant, generate_repair_drill, or assemble_mockup
- generated stimulus
- answer key
- trap design
- cue-safe rationale
- validator checks

Preferred order:

1. Enrich existing mini mockups with tags, cues, explanations, traps, and repair rules.
2. Generate small variants for under-covered strategy cards.
3. Generate repair drills from real learner mistake patterns.
4. Assemble section mockups from approved mini mockups.
5. Assemble full mockups only after enough approved section content exists.

Subagent output must be rejected if:

- the generated item cannot exercise the target strategy
- the hint gives away the answer
- the answer key cannot be validated
- distractors do not map to known traps
- listening/speaking scripts lack natural structure
- writing prompts cannot support the target response template
- a full mockup includes raw unapproved generated items
- an assembled mockup has repeated topics, repeated traps, or uneven difficulty

## Mini Mockup Policy

Mini mockups are the best default training unit for beta because they are cheap, fast, measurable, and easy to repair.

Use mini mockups for:

- daily practice
- onboarding diagnostic
- weak-skill repair
- testing new generated content in beta
- pacing practice
- cue-to-no-cue progression

Do not spend tokens generating full tests when a learner needs one targeted repair drill. Full mockups should be reserved for readiness checks, weekly diagnostics, and paid/high-intent practice.

## First Implementation Set

Build these first because they unlock the highest beta value:

1. R-002 Rephrase Question
2. R-003 Synonym Match
3. R-006 Negative Factual Elimination
4. R-011 Summary Big Ideas
5. L-002 Gist First
6. L-004 Transition Words
7. S-003 Independent Speaking Opinion
8. S-004 Campus Change Integrated Speaking
9. W-001 Integrated Writing Counterpoint
10. W-004 Academic Discussion Stance

This first set gives the app strong guided practice across all four TOEFL sections without requiring a full content library.
