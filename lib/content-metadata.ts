import { mockTests, MockQuestion } from '@/lib/mock-tests';
import { practiceCards } from '@/lib/seed';
import { ContentMetadata, PracticeCard, Section } from '@/lib/types';

type MetadataTemplate = Omit<ContentMetadata, 'contentId' | 'section'>;

const sectionMetadataProfiles: Record<Section, Omit<ContentMetadata, 'contentId' | 'section' | 'questionType'>> = {
  reading: {
    taskType: 'read_academic_passage',
    strategyCardId: 'R-003',
    difficultyBand: 'B2',
    timingSeconds: 75,
    traps: ['matching exact words instead of meaning', 'choosing a true detail that does not answer the question'],
    cue: 'Rephrase the question, then match meaning to evidence.',
    repairRule: 'Redo one evidence-first reading card and name the sentence that supports the answer.',
    sourceType: 'approved_seed',
    reviewStatus: 'approved',
  },
  listening: {
    taskType: 'listen_academic_or_campus',
    strategyCardId: 'L-001',
    difficultyBand: 'B2',
    timingSeconds: 90,
    traps: ['writing too much while missing structure', 'treating a minor detail as the main point'],
    cue: 'Track purpose, role, transition, example, and attitude before details.',
    repairRule: 'Redo one listening card and write only purpose, example, contrast, and speaker attitude notes.',
    sourceType: 'approved_seed',
    reviewStatus: 'approved',
  },
  speaking: {
    taskType: 'speak_independent_or_integrated',
    strategyCardId: 'S-001',
    difficultyBand: 'B2',
    timingSeconds: 60,
    traps: ['long setup', 'missing source detail', 'unfinished final sentence'],
    cue: 'State the main idea fast, give one clear support point, and finish cleanly.',
    repairRule: 'Record a 45-60 second redo with a shorter opening and one complete final sentence.',
    sourceType: 'approved_seed',
    reviewStatus: 'approved',
  },
  writing: {
    taskType: 'write_integrated_or_discussion',
    strategyCardId: 'W-001',
    difficultyBand: 'B2',
    timingSeconds: 600,
    traps: ['summarizing without comparison', 'adding vague support', 'weak paragraph control'],
    cue: 'Use a clear structure and connect each support point directly to the task.',
    repairRule: 'Rewrite one paragraph so the claim, support, and task connection are explicit.',
    sourceType: 'approved_seed',
    reviewStatus: 'approved',
  },
};

const subskillTemplates: Record<string, Partial<MetadataTemplate>> = {
  'vocabulary in context': {
    questionType: 'vocabulary',
    strategyCardId: 'R-004',
    timingSeconds: 45,
    traps: ['overusing context on a known word', 'choosing a nearby but wrong connotation'],
    cue: 'If the word is familiar, answer fast; use context only when uncertain.',
    repairRule: 'Do a timed vocabulary replacement card and explain the context clue in one phrase.',
  },
  'factual detail': {
    questionType: 'factual',
    strategyCardId: 'R-005',
    timingSeconds: 70,
    traps: ['using outside logic', 'choosing a true statement that misses the question target'],
    cue: 'Find the subject, then match the stated reason or result.',
    repairRule: 'Redo a factual card by naming the subject and evidence before selecting an answer.',
  },
  inference: {
    questionType: 'inference',
    strategyCardId: 'R-008',
    timingSeconds: 80,
    traps: ['overreaching beyond evidence', 'choosing outside common sense instead of text support'],
    cue: 'Infer only one small step from evidence.',
    repairRule: 'Redo an inference card and reject every answer that adds unsupported information.',
  },
  'rhetorical purpose': {
    questionType: 'author_purpose',
    strategyCardId: 'R-007',
    traps: ['explaining what a detail says instead of why it appears'],
    cue: 'Ask why the detail is here: support, contrast, define, or exemplify.',
    repairRule: 'Classify the function of one detail before answering another purpose card.',
  },
  reference: {
    questionType: 'reference',
    strategyCardId: 'R-010',
    timingSeconds: 55,
    traps: ['choosing a nearby noun that breaks sentence logic'],
    cue: 'Check the nearest logical antecedent and reread the full sentence.',
    repairRule: 'Redo a reference card and say the pronoun replacement out loud.',
  },
  'sentence insertion': {
    questionType: 'sentence_insertion',
    strategyCardId: 'R-010',
    timingSeconds: 90,
    traps: ['placing a sentence before its pronoun reference is clear', 'ignoring transition flow'],
    cue: '2026 readiness: use pronouns, transitions, and known-new idea flow to place the sentence.',
    repairRule: 'Redo one sentence insertion card and name the pronoun/reference clue before choosing the slot.',
  },
  'negative factual information': {
    questionType: 'negative_factual',
    strategyCardId: 'R-006',
    timingSeconds: 90,
    traps: ['selecting a stated choice', 'forgetting NOT or EXCEPT'],
    cue: 'Find the three stated choices; the leftover unstated choice is the answer.',
    repairRule: 'Cross out three supported choices before selecting the answer on the next NOT/EXCEPT card.',
  },
  summary: {
    questionType: 'summary',
    strategyCardId: 'R-011',
    timingSeconds: 95,
    traps: ['choosing true details', 'choosing duplicate or narrow ideas'],
    cue: 'Pick broad paragraph-level ideas, not details.',
    repairRule: 'Sort answer choices into main idea, detail, unrelated, or duplicate before answering.',
  },
  pacing: {
    questionType: 'passage_workflow',
    strategyCardId: 'R-001',
    timingSeconds: 60,
    traps: ['rereading a difficult paragraph too long', 'losing coverage across the set'],
    cue: 'Label paragraph purpose, move on, and return only when a question requires it.',
    repairRule: 'Do a paragraph-location drill before another timed reading card.',
  },
  gist: {
    questionType: 'gist',
    strategyCardId: 'L-002',
    traps: ['choosing a detail as the main idea', 'confusing topic with speaker purpose'],
    cue: 'Separate the topic from why the speaker is talking.',
    repairRule: 'Listen or reread the opening and write topic vs purpose in two bullets.',
  },
  detail: {
    questionType: 'listening_detail',
    strategyCardId: 'L-005',
    traps: ['memorizing random facts', 'missing repeated or stressed details'],
    cue: 'Important details support the main point, problem, reason, example, or decision.',
    repairRule: 'Redo one detail card with a must/should/could note filter.',
  },
  'speaker attitude': {
    questionType: 'speaker_attitude',
    strategyCardId: 'L-006',
    traps: ['literal interpretation', 'ignoring contrast or tone'],
    cue: 'Listen for tone and reason behind the words.',
    repairRule: 'Replay or reread the key sentence and label the attitude before answering.',
  },
  organization: {
    questionType: 'organization',
    strategyCardId: 'L-007',
    traps: ['mixing example order', 'missing contrast or sequence'],
    cue: 'Map topic, definition, examples, contrast, cause/effect, or chronology.',
    repairRule: 'Make a three-line organization map before the next listening or speaking task.',
  },
  function: {
    questionType: 'function',
    strategyCardId: 'L-006',
    traps: ['summarizing content instead of function'],
    cue: 'Ask why the speaker said it, not just what the sentence means.',
    repairRule: 'Classify one sentence as example, correction, concern, agreement, or contrast.',
  },
  'note-taking quality': {
    questionType: 'note_taking',
    strategyCardId: 'L-001',
    traps: ['writing full sentences', 'missing the next point while copying'],
    cue: 'Use sparse labels for purpose, examples, contrast, attitude, and decisions.',
    repairRule: 'Redo notes with only symbols and short labels, then answer one question.',
  },
  'cause and effect': {
    questionType: 'listening_relationship',
    strategyCardId: 'L-007',
    traps: ['recording events without their relationship', 'missing signal words for result or reason'],
    cue: 'Mark cause arrows quickly: change -> effect -> evidence.',
    repairRule: 'Redo one listening card and label each reason/effect pair before choosing an answer.',
  },
  'campus roles': {
    questionType: 'campus_roles',
    strategyCardId: 'L-003',
    timingSeconds: 75,
    traps: ['confusing official records with class help', 'missing the speaker role before answering'],
    cue: '2026 readiness: sort the campus role first — professor, adviser, registrar — then answer.',
    repairRule: 'Redo one campus conversation card and label each speaker role before choosing the answer.',
  },
  fluency: {
    questionType: 'independent_speaking',
    strategyCardId: 'S-001',
    traps: ['too many ideas', 'restarting sentences under pressure'],
    cue: 'Use one reason and one concrete example instead of listing ideas.',
    repairRule: 'Record a one-reason redo and remove one unnecessary setup sentence.',
  },
  'timing control': {
    questionType: 'speaking_timing',
    strategyCardId: 'S-002',
    traps: ['long opening', 'rushed ending'],
    cue: 'Cut setup first; protect the final sentence.',
    repairRule: 'Record with a 10-second opening limit and one stronger support point.',
  },
  'response structure': {
    questionType: 'integrated_speaking_structure',
    strategyCardId: 'S-003',
    traps: ['jumping between examples', 'missing the source order'],
    cue: 'Open with the main idea, then follow the source order with one example at a time.',
    repairRule: 'Record a redo that uses source order labels before each example.',
  },
  'integrated speaking template': {
    questionType: 'integrated_speaking_template',
    strategyCardId: 'S-003',
    timingSeconds: 60,
    traps: ['using the template as a script', 'missing source order', 'adding personal opinion'],
    cue: 'Template reveal: use the scaffold to protect source order, then remove extra wording.',
    repairRule: 'Record one integrated speaking redo using the five-beat template, then cut one unnecessary phrase.',
  },
  'clarity/pronunciation': {
    questionType: 'speaking_delivery',
    strategyCardId: 'S-004',
    traps: ['dropping final sounds', 'speaking too fast under stress'],
    cue: 'Slow slightly on key nouns and finish every final word audibly.',
    repairRule: 'Record a delivery redo and mark two words that became clearer.',
  },
  'source integration': {
    questionType: 'integrated_speaking_sources',
    strategyCardId: 'S-003',
    traps: ['adding personal opinion', 'missing the recommended solution or reason'],
    cue: 'Name the problem, the recommendation, and the reason without adding opinion.',
    repairRule: 'Redo one integrated speaking answer using problem -> solution -> reason.',
  },
  'mock speaking': {
    questionType: 'mini_mock_speaking',
    strategyCardId: 'S-003',
    traps: ['treating notes as a script', 'missing the source relationship under timing'],
    cue: 'Answer in a compact source order and keep the final sentence complete.',
    repairRule: 'Redo the mini mock speaking prompt with problem/source order labels first.',
  },
  'integrated synthesis': {
    questionType: 'integrated_writing',
    strategyCardId: 'W-001',
    traps: ['adding personal opinion', 'summarizing reading without lecture challenge'],
    cue: 'Pair each reading claim with the lecture challenge.',
    repairRule: 'Rewrite one body paragraph as reading claim -> lecture challenge -> result.',
  },
  'integrated writing outline': {
    questionType: 'integrated_writing_outline',
    strategyCardId: 'W-001',
    timingSeconds: 600,
    traps: ['summarizing only one source', 'adding personal opinion', 'writing before source pairs are clear'],
    cue: '2026 readiness: build the outline from source pairs before drafting.',
    repairRule: 'Rewrite one body paragraph as reading claim -> lecture challenge -> result.',
  },
  'discussion response quality': {
    questionType: 'academic_discussion',
    strategyCardId: 'W-004',
    timingSeconds: 600,
    traps: ['repeating classmates', 'missing a fresh supporting point'],
    cue: 'Take a clear stance and add one fresh reason with a concrete example.',
    repairRule: 'Rewrite the response with one sentence that clearly adds your own contribution.',
  },
  'support quality': {
    questionType: 'academic_discussion',
    strategyCardId: 'W-004',
    timingSeconds: 600,
    traps: ['several vague reasons', 'example without consequence'],
    cue: 'One developed reason with a concrete example beats several shallow reasons.',
    repairRule: 'Expand one example with a class, event, or consequence.',
  },
  coherence: {
    questionType: 'writing_revision',
    strategyCardId: 'W-002',
    traps: ['weak transitions', 'paragraphs that shift focus'],
    cue: 'Make the logic between sentences visible.',
    repairRule: 'Add one transition and one clearer topic sentence in a revision pass.',
  },
  'grammar control': {
    questionType: 'writing_revision',
    strategyCardId: 'W-003',
    traps: ['repeated verb tense errors', 'article and agreement breakdowns'],
    cue: 'Use a revision pass for repeated grammar patterns, not just spelling.',
    repairRule: 'List the two grammar patterns you corrected and rewrite two sentences.',
  },
  structure: {
    questionType: 'writing_structure',
    strategyCardId: 'W-002',
    traps: ['unclear thesis', 'body paragraphs without a visible job'],
    cue: 'Give each paragraph one job and make the task connection explicit.',
    repairRule: 'Rewrite the outline as thesis plus one sentence job for each body paragraph.',
  },
};

function requireSubskillTemplate(contentId: string, subskill: string, overrides: Partial<MetadataTemplate>) {
  const subskillTemplate = subskillTemplates[subskill];
  const hasCompleteExplicitMetadata = Boolean(
    overrides.taskType &&
      overrides.questionType &&
      overrides.strategyCardId &&
      overrides.difficultyBand &&
      overrides.timingSeconds &&
      overrides.traps &&
      overrides.cue &&
      overrides.repairRule,
  );

  if (!subskillTemplate && !hasCompleteExplicitMetadata) {
    throw new Error(`Missing approved metadata for ${contentId} (${subskill}). Add a reviewed subskill template before exposing this content.`);
  }
  return subskillTemplate ?? {};
}

function buildApprovedMetadata(contentId: string, section: Section, subskill: string, overrides: Partial<MetadataTemplate> = {}): ContentMetadata {
  const sectionProfile = sectionMetadataProfiles[section];
  const subskillTemplate = requireSubskillTemplate(contentId, subskill, overrides);

  return {
    contentId,
    section,
    taskType: overrides.taskType ?? subskillTemplate.taskType ?? sectionProfile.taskType,
    questionType: overrides.questionType ?? subskillTemplate.questionType ?? subskill,
    strategyCardId: overrides.strategyCardId ?? subskillTemplate.strategyCardId ?? sectionProfile.strategyCardId,
    difficultyBand: overrides.difficultyBand ?? subskillTemplate.difficultyBand ?? sectionProfile.difficultyBand,
    timingSeconds: overrides.timingSeconds ?? subskillTemplate.timingSeconds ?? sectionProfile.timingSeconds,
    traps: overrides.traps ?? subskillTemplate.traps ?? sectionProfile.traps,
    cue: overrides.cue ?? subskillTemplate.cue ?? sectionProfile.cue,
    repairRule: overrides.repairRule ?? subskillTemplate.repairRule ?? sectionProfile.repairRule,
    sourceType: 'approved_seed',
    reviewStatus: 'approved',
  };
}

export const practiceCardMetadata: Record<string, ContentMetadata> = Object.fromEntries(
  Object.values(practiceCards).flatMap((cards) => cards.map((card) => [card.id, buildApprovedMetadata(card.id, card.section, card.subskill)])),
);

export const mockQuestionMetadata: Record<string, ContentMetadata> = Object.fromEntries(
  mockTests.flatMap((mock) =>
    mock.questions.map((question) => [
      question.id,
      buildApprovedMetadata(question.id, question.section, question.subskill, {
        taskType: question.section === 'reading' ? 'mini_mock_reading_question' : 'mini_mock_listening_question',
        timingSeconds: 75,
      }),
    ]),
  ),
);

export const mockTestMetadata: Record<string, ContentMetadata> = Object.fromEntries(
  mockTests.map((mock) => [
    mock.id,
    buildApprovedMetadata(mock.id, 'listening', 'mini mock', {
      taskType: 'mini_mockup',
      questionType: 'mixed_section_mockup',
      strategyCardId: 'mixed-approved-seed-mini-mockup',
      difficultyBand: 'B2',
      timingSeconds: mock.minutes * 60,
      traps: ['answering before notes are complete', 'treating the completion signal as an official TOEFL score'],
      cue: 'Take the mini mock like an exam, then use review to choose one repair drill.',
      repairRule: 'Review missed subskills and complete the first recommended section practice card.',
    }),
  ]),
);

export function getPracticeCardMetadata(card: PracticeCard) {
  const metadata = practiceCardMetadata[card.id];
  if (!metadata) {
    throw new Error(`Missing approved metadata for ${card.id}. Add it to the registry before exposing this practice card.`);
  }
  return metadata;
}

export function getMockQuestionMetadata(question: MockQuestion) {
  const metadata = mockQuestionMetadata[question.id];
  if (!metadata) {
    throw new Error(`Missing approved metadata for ${question.id}. Add it to the registry before exposing this mock question.`);
  }
  return metadata;
}

export function getMockTestMetadata(testId: string) {
  const metadata = mockTestMetadata[testId];
  if (!metadata) {
    throw new Error(`Missing approved metadata for ${testId}. Add it to the registry before exposing this mini mock.`);
  }
  return metadata;
}

export function buildRepairNote(metadata: ContentMetadata) {
  return `Strategy ${metadata.strategyCardId}: ${metadata.repairRule}`;
}
