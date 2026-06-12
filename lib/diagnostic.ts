import { diagnosticQuestions } from '@/lib/seed';
import { DiagnosticQuestion } from '@/lib/types';

export type DiagnosticFormId = 'baseline' | 'fresh-beta';

const freshBetaDiagnosticQuestions: DiagnosticQuestion[] = [
  {
    id: 'fb-r1',
    section: 'reading',
    subskill: 'vocabulary in context',
    prompt: 'A passage says the committee adopted a “cautious” approach after earlier estimates proved unreliable. The word cautious is closest in meaning to:',
    options: ['Careful', 'Expensive', 'Immediate', 'Popular'],
    answer: 0,
    explanation: 'Unreliable earlier estimates explain why the committee acted carefully rather than quickly or casually.',
  },
  {
    id: 'fb-r2',
    section: 'reading',
    subskill: 'factual detail',
    prompt: 'According to a short passage about river farming, why did crops grow better near the floodplain?',
    options: ['Farmers stopped using tools', 'The river became salty', 'The soil received fresh nutrients', 'Plants needed less sunlight'],
    answer: 2,
    explanation: 'The stated reason is nutrient-rich soil left by flooding.',
  },
  {
    id: 'fb-r3',
    section: 'reading',
    subskill: 'inference',
    prompt: 'A passage says museum attendance rose after evening hours were added for workers and students. What is the safest inference?',
    options: ['The museum removed all daytime visits', 'Schedule access likely affected attendance', 'Workers dislike museums', 'Students received free tickets every day'],
    answer: 1,
    explanation: 'The timing change plausibly made visits easier, but the other options add unsupported extremes.',
  },
  {
    id: 'fb-r4',
    section: 'reading',
    subskill: 'rhetorical purpose',
    prompt: 'Why might an author mention a common misunderstanding before explaining a scientific process?',
    options: ['To prove the topic is impossible', 'To avoid giving evidence', 'To introduce an unrelated story', 'To prepare readers to notice the correction'],
    answer: 3,
    explanation: 'The misunderstanding sets up the corrected explanation that follows.',
  },
  {
    id: 'fb-r5',
    section: 'reading',
    subskill: 'pacing',
    prompt: 'During a dense reading passage, what is the best first move before answering detail questions?',
    options: ['Translate every sentence fully', 'Map each paragraph purpose in a few words', 'Read only the title', 'Guess before looking back'],
    answer: 1,
    explanation: 'A fast purpose map helps you locate evidence without wasting time.',
  },
  {
    id: 'fb-l1',
    section: 'listening',
    subskill: 'gist',
    prompt: 'In a campus conversation, a student asks how to replace a lost lab notebook before grading. What is the main purpose of the conversation?',
    options: ['To choose a new major', 'To solve a course-material problem', 'To plan a concert', 'To request housing'],
    answer: 1,
    explanation: 'The conversation centers on solving the missing-notebook problem for the course.',
  },
  {
    id: 'fb-l2',
    section: 'listening',
    subskill: 'detail',
    prompt: 'A lecture states that some birds use Earth’s magnetic field during migration. Which detail is specifically stated?',
    options: ['All birds stop migrating', 'Magnetic cues can support navigation', 'Birds migrate only at noon', 'Migration depends only on smell'],
    answer: 1,
    explanation: 'The lecture specifically identifies magnetic cues as one navigation aid.',
  },
  {
    id: 'fb-l3',
    section: 'listening',
    subskill: 'inference',
    prompt: 'A professor says, “Your revised thesis is much narrower, so the evidence should be easier to organize.” What can be inferred?',
    options: ['The paper is already finished', 'Evidence is no longer needed', 'The first thesis was probably too broad', 'The student changed classes'],
    answer: 2,
    explanation: 'The comparison implies the earlier thesis lacked focus.',
  },
  {
    id: 'fb-l4',
    section: 'listening',
    subskill: 'organization',
    prompt: 'A lecture introduces a problem, describes two attempted solutions, then explains why the second worked better. What should your notes capture?',
    options: ['Only names and dates', 'Every adjective', 'Only the professor’s final sentence', 'Problem, solution one, solution two, result'],
    answer: 3,
    explanation: 'The structure is problem-solution-comparison, so notes should preserve that order.',
  },
  {
    id: 'fb-l5',
    section: 'listening',
    subskill: 'note-taking quality',
    prompt: 'For a lecture comparing two theories, which note style is most useful?',
    options: ['A two-column comparison with evidence for each theory', 'A paragraph copied word for word', 'Only unfamiliar vocabulary', 'No notes until the final minute'],
    answer: 0,
    explanation: 'A comparison chart helps answer relationship and detail questions quickly.',
  },
  {
    id: 'fb-s1',
    section: 'speaking',
    subskill: 'fluency',
    prompt: 'In an independent speaking answer, what usually helps fluency most?',
    options: ['Change your opinion every sentence', 'Choose one clear reason before speaking', 'Use as many memorized phrases as possible', 'Stop and restart whenever grammar is imperfect'],
    answer: 1,
    explanation: 'One planned reason reduces hesitation and supports a smoother answer.',
  },
  {
    id: 'fb-s2',
    section: 'speaking',
    subskill: 'timing control',
    prompt: 'If your speaking answer ends before the example is clear, what should you adjust first?',
    options: ['Add a longer introduction', 'Speak without transitions', 'Use two extra examples', 'Spend less time on setup'],
    answer: 3,
    explanation: 'Cutting setup protects time for the evidence that actually supports the answer.',
  },
  {
    id: 'fb-s3',
    section: 'speaking',
    subskill: 'organization',
    prompt: 'For integrated speaking, what is the safest organization principle?',
    options: ['Keep source relationships clear', 'Add personal opinions first', 'Ignore the reading source', 'List details randomly'],
    answer: 0,
    explanation: 'Integrated tasks reward clear alignment between source points and responses.',
  },
  {
    id: 'fb-s4',
    section: 'speaking',
    subskill: 'clarity/pronunciation',
    prompt: 'Which delivery habit most improves listener understanding?',
    options: ['Rush every sentence', 'Avoid stress on important nouns', 'Finish key words clearly', 'Whisper difficult words'],
    answer: 2,
    explanation: 'Clear endings and stressed content words help the listener follow the response.',
  },
  {
    id: 'fb-s5',
    section: 'speaking',
    subskill: 'response structure',
    prompt: 'Why should a speaking template stay simple?',
    options: ['It guarantees official TOEFL scoring', 'It replaces task understanding', 'It lets you skip examples', 'It frees attention for the actual answer'],
    answer: 3,
    explanation: 'A simple template lowers load, but the content still has to answer the prompt.',
  },
  {
    id: 'fb-w1',
    section: 'writing',
    subskill: 'structure',
    prompt: 'In integrated writing, what is the strongest paragraph plan?',
    options: ['Reading claim plus matching lecture challenge', 'Personal story only', 'All lecture details without reading links', 'One sentence total'],
    answer: 0,
    explanation: 'The task depends on showing how the lecture responds to the reading.',
  },
  {
    id: 'fb-w2',
    section: 'writing',
    subskill: 'coherence',
    prompt: 'Which revision best improves coherence in a discussion response?',
    options: ['Remove the position sentence', 'Add unrelated vocabulary', 'Add a transition that explains the relationship between ideas', 'Repeat the same phrase in every sentence'],
    answer: 2,
    explanation: 'Coherence improves when the reader can follow why one idea leads to the next.',
  },
  {
    id: 'fb-w3',
    section: 'writing',
    subskill: 'grammar control',
    prompt: 'Which editing priority usually helps a TOEFL writing response most?',
    options: ['Make every sentence extremely long', 'Remove all transitions', 'Use rare words even if incorrect', 'Fix repeated sentence-level errors that obscure meaning'],
    answer: 3,
    explanation: 'Repeated grammar errors can reduce clarity, so they are high-impact edits.',
  },
  {
    id: 'fb-w4',
    section: 'writing',
    subskill: 'support quality',
    prompt: 'What makes support stronger in an Academic Discussion response?',
    options: ['One specific reason connected to the prompt', 'Several vague claims', 'No example', 'Only repeating classmates'],
    answer: 0,
    explanation: 'Specific support tied to the prompt is stronger than many undeveloped claims.',
  },
  {
    id: 'fb-w5',
    section: 'writing',
    subskill: 'integrated synthesis',
    prompt: 'What should integrated writing avoid?',
    options: ['Paraphrasing lecture points', 'Comparing sources', 'Inventing outside facts not found in the sources', 'Using source-based transitions'],
    answer: 2,
    explanation: 'Integrated writing should report source relationships, not add outside evidence.',
  },
  {
    id: 'fb-w6',
    section: 'writing',
    subskill: 'discussion response quality',
    prompt: 'For Academic Discussion, what should your response contribute?',
    options: ['A direct position plus a fresh supporting idea', 'Only a summary of classmates', 'No stance', 'An unrelated personal biography'],
    answer: 0,
    explanation: 'The response should join the discussion with a clear, relevant contribution.',
  },
];

export const diagnosticForms: Record<DiagnosticFormId, DiagnosticQuestion[]> = {
  baseline: diagnosticQuestions,
  'fresh-beta': freshBetaDiagnosticQuestions,
};

export function isDiagnosticFormId(value: string): value is DiagnosticFormId {
  return value === 'baseline' || value === 'fresh-beta';
}

export function getDiagnosticQuestions(formId: string = 'baseline') {
  return diagnosticForms[isDiagnosticFormId(formId) ? formId : 'baseline'];
}

export function getNextDiagnosticFormId(formId: string = 'baseline'): DiagnosticFormId {
  return formId === 'fresh-beta' ? 'baseline' : 'fresh-beta';
}
