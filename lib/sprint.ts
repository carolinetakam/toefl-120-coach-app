import { daysUntil } from '@/lib/dates';
import { AppState, Section } from '@/lib/types';

export type SprintDayType = 'diagnose' | 'templates' | 'pressure' | 'repair' | 'final';

export type SprintAction =
  | {
      type: 'practice';
      label: string;
      section: Section;
      cardId: string;
      reason: string;
    }
  | {
      type: 'mock';
      label: string;
      mockId: string;
      reason: string;
    }
  | {
      type: 'review';
      label: string;
      section?: Section;
      reason: string;
    };

export interface SprintDay {
  day: number;
  title: string;
  type: SprintDayType;
  minutes: number;
  sectionFocus: Section[];
  outcome: string;
  tasks: string[];
  actions: SprintAction[];
}

export interface SectionPlaybook {
  section: Section;
  title: string;
  testShape: string;
  winCondition: string;
  noteFormat: string[];
  template: string[];
  traps: string[];
  drills: string[];
}

const sectionPriority: Section[] = ['speaking', 'writing', 'listening', 'reading'];

const sectionDrillIds: Record<Section, string[]> = {
  reading: ['pr-r-1', 'pr-r-2', 'pr-r-4'],
  listening: ['pr-l-1', 'pr-l-4', 'pr-l-5'],
  speaking: ['pr-s-2', 'pr-s-4', 'pr-s-6'],
  writing: ['pr-w-4', 'pr-w-3', 'pr-w-6'],
};

function uniqueSections(...sections: Section[]) {
  return sections.filter((section, index) => sections.indexOf(section) === index);
}

function firstDrillFor(section: Section) {
  return sectionDrillIds[section][0];
}

function secondDrillFor(section: Section) {
  return sectionDrillIds[section][1] ?? sectionDrillIds[section][0];
}

export const sectionPlaybooks: Record<Section, SectionPlaybook> = {
  reading: {
    section: 'reading',
    title: 'Reading: synonym and evidence game',
    testShape: '120-style prep + 2026 readiness: classic reading skills still matter, but this is not an official score or full 2026 simulator.',
    winCondition: 'Answer from the text, not from memory. Rephrase the question, locate the evidence, then choose the closest meaning.',
    noteFormat: ['Title/main topic', 'Paragraph purpose labels', 'Question keywords', 'Evidence sentence'],
    template: [
      'Read title and first paragraph sentence.',
      'Read the question, not all answer choices first.',
      'Rephrase the question in simple words.',
      'Find synonyms or the same relationship in the paragraph.',
      'Reject answers that are true but do not answer the question.',
    ],
    traps: ['Exact-word matching', 'Over-reading one paragraph', 'Choosing specific details for summary questions'],
    drills: ['10-question synonym hunt', 'Paragraph purpose map', 'Summary answer-choice sort'],
  },
  listening: {
    section: 'listening',
    title: 'Listening: structure before details',
    testShape: '120-style prep + 2026 readiness: campus and academic audio skills still matter, but this is not an official score or full 2026 simulator.',
    winCondition: 'Capture why the speaker says each major point, not every word.',
    noteFormat: ['Purpose/problem', 'Main point', 'Example 1/2', 'Contrast or attitude', 'Decision/result'],
    template: [
      'Write sparse labels, not sentences.',
      'Mark contrast words: however, but, actually, instead.',
      'Separate topic from speaker purpose.',
      'For details, ask what major point the detail supports.',
    ],
    traps: ['Copying too much', 'Missing speaker attitude', 'Confusing example with main idea'],
    drills: ['Purpose vs topic split', 'Two-example lecture notes', 'Attitude/function question set'],
  },
  speaking: {
    section: 'speaking',
    title: 'Speaking: template removes hesitation',
    testShape: '120-style prep + 2026 readiness: short-prep speaking templates build clarity and pace, but this is not an official score or full 2026 simulator.',
    winCondition: 'Start fast, use one clear structure, include source/detail when required, and finish the final sentence.',
    noteFormat: ['Main idea', 'Reason/source point', 'Example/detail', 'Finish sentence'],
    template: [
      'Personally, I think ___ because ___.',
      'For example, ___.',
      'This matters because ___.',
      'So overall, ___.',
    ],
    traps: ['Long intro', 'Two rushed reasons', 'No source detail', 'Unfinished ending', 'Mumbling under pressure'],
    drills: ['10-second opening limit', '45-second independent answer', '60-second integrated answer', 'Playback clarity check'],
  },
  writing: {
    section: 'writing',
    title: 'Writing: scaffold, then revise',
    testShape: '120-style prep + 2026 readiness: integrated and academic discussion practice builds task control, but this is not an official score or full 2026 simulator.',
    winCondition: 'Make the task relationship obvious: claim, support, example, and source/peer response.',
    noteFormat: ['Prompt demand', 'Stance or source claim', 'Reason 1', 'Concrete example/detail', 'Revision target'],
    template: [
      'The topic has generated discussion because ___.',
      'My position is ___ because ___.',
      'For example, ___.',
      'I understand the other view, but ___.',
      'Therefore, ___.',
    ],
    traps: ['Vague reasons', 'Repeating classmates', 'No fresh contribution', 'No revision pass', 'Grammar pattern repeats'],
    drills: ['120-word discussion in 10 minutes', 'One paragraph integrated contrast', 'Two-sentence grammar repair'],
  },
};

function sortWeakSections(state: AppState) {
  return [...sectionPriority].sort((a, b) => {
    const scoreGap = state.sectionScores[a] - state.sectionScores[b];
    if (scoreGap !== 0) return scoreGap;
    return sectionPriority.indexOf(a) - sectionPriority.indexOf(b);
  });
}

export function getSprintMode(state: AppState) {
  const days = daysUntil(state.profile.testDate);
  if (days <= 3) return '3-day emergency sprint';
  if (days <= 5) return '5-day max sprint';
  return '5-day sprint + maintenance';
}

export function generateSprintPlan(state: AppState): SprintDay[] {
  const available = Math.max(30, state.profile.dailyMinutes);
  const weak = sortWeakSections(state);
  const first = weak[0] ?? 'speaking';
  const second = weak[1] ?? 'writing';

  const plan: SprintDay[] = [
    {
      day: 1,
      title: 'Baseline and templates',
      type: 'diagnose',
      minutes: available,
      sectionFocus: uniqueSections('speaking', 'writing', first),
      outcome: 'Know the weak section and memorize the first speaking/writing templates.',
      tasks: [
        'Finish onboarding and strategy diagnostic.',
        'Record one speaking answer with the 60-second timer.',
        'Write one academic discussion response, then revise one paragraph.',
      ],
      actions: [
        {
          type: 'practice',
          label: 'Record timed speaking',
          section: 'speaking',
          cardId: 'pr-s-2',
          reason: 'Test-week speed prep depends on removing hesitation early, so the first proof is a timed recorded answer.',
        },
        {
          type: 'practice',
          label: 'Write discussion template',
          section: 'writing',
          cardId: 'pr-w-4',
          reason: 'The fastest writing gain is a repeatable position, reason, and example structure.',
        },
      ],
    },
    {
      day: 2,
      title: 'Question recognition and pressure reps',
      type: 'pressure',
      minutes: available,
      sectionFocus: ['reading', 'listening', 'speaking'],
      outcome: 'Stop losing points to question-type traps and reduce speaking hesitation.',
      tasks: [
        'Do reading synonym/evidence drills before reading full passages.',
        'Take listening notes using only purpose, example, contrast, attitude, and decision labels.',
        'Record three timed speaking answers and redo the weakest one immediately.',
      ],
      actions: [
        {
          type: 'practice',
          label: 'Fix reading traps',
          section: 'reading',
          cardId: 'pr-r-1',
          reason: 'A short evidence drill beats rereading whole passages when time is limited.',
        },
        {
          type: 'practice',
          label: 'Fix listening notes',
          section: 'listening',
          cardId: 'pr-l-5',
          reason: 'Compact listening notes make the mini mock measurable instead of guess-based.',
        },
        {
          type: 'practice',
          label: 'Redo speaking under pressure',
          section: 'speaking',
          cardId: 'pr-s-4',
          reason: 'The second day should prove clarity while the clock is running.',
        },
      ],
    },
    {
      day: 3,
      title: 'Mini mock and final repair',
      type: 'final',
      minutes: available,
      sectionFocus: uniqueSections(first, second, 'writing'),
      tasks: [
        'Complete the mini mock without pausing.',
        'Put each miss into a repair category.',
        'Write one 10-minute discussion response and revise one paragraph.',
      ],
      outcome: 'Convert practice into proof, then repair the biggest leak.',
      actions: [
        {
          type: 'mock',
          label: 'Run mini mock proof',
          mockId: 'mock-campus-policy-3',
          reason: 'Day 3 must produce proof: objective answers, writing signal, and speaking evidence.',
        },
        {
          type: 'practice',
          label: 'Repair weakest leak',
          section: first,
          cardId: firstDrillFor(first),
          reason: 'After the mock, spend the remaining time only on the highest-leverage miss.',
        },
      ],
    },
    {
      day: 4,
      title: 'Weakest-section double pass',
      type: 'repair',
      minutes: available,
      sectionFocus: [first, second],
      outcome: 'Use the extra day only on the biggest score leak.',
      tasks: [
        `Do two deliberate ${first} drills.`,
        `Do one timed ${second} drill.`,
        'Review only misses and shaky answers, not everything.',
      ],
      actions: [
        {
          type: 'practice',
          label: `First ${first} repair`,
          section: first,
          cardId: firstDrillFor(first),
          reason: 'The optional fourth day is not more content; it is a second pass on the weakest score leak.',
        },
        {
          type: 'practice',
          label: `Second ${second} repair`,
          section: second,
          cardId: secondDrillFor(second),
          reason: 'Use the extra day only if it improves a measured weak section.',
        },
      ],
    },
    {
      day: 5,
      title: 'Final confidence run',
      type: 'final',
      minutes: Math.min(available, 90),
      sectionFocus: ['speaking', 'writing', 'listening', 'reading'],
      outcome: 'Enter test day with templates, timing, and repair rules fresh.',
      tasks: [
        'One short mixed set.',
        'One speaking recording with clean finish.',
        'One writing outline without full draft.',
        'Stop heavy study and review only template cards.',
      ],
      actions: [
        {
          type: 'mock',
          label: 'Final confidence mini mock',
          mockId: 'mock-final-confidence-4',
          reason: 'The fifth day is the maximum; it should confirm readiness, not start new study.',
        },
        {
          type: 'review',
          label: 'Review only template cards',
          reason: 'After the final proof set, protect confidence and avoid late over-study.',
        },
      ],
    },
  ];

  return plan;
}

export function getTodaySprintDay(state: AppState, now = new Date()) {
  const plan = generateSprintPlan(state);
  const daysLeft = daysUntil(state.profile.testDate, now);
  if (daysLeft <= 1) return plan[2];
  if (daysLeft <= 2) return plan[1];
  if (daysLeft <= 3) return plan[0];
  if (daysLeft <= 4) return plan[1];
  if (daysLeft <= 5) return plan[0];
  return plan[0];
}

export function getSprintReadinessGates(state: AppState) {
  const speakingReps = state.speakingAttempts.length;
  const audioBackedSpeakingReps = state.speakingAttempts.filter((item) => item.hasAudioEvidence).length;
  const writingReps = state.writingDrafts.length + state.practiceHistory.filter((item) => item.section === 'writing').length;
  const mockReps = state.practiceHistory.filter((item) => item.subskill === 'mini mock').length;
  const objectiveReps = state.practiceHistory.filter((item) => item.section === 'reading' || item.section === 'listening').length;

  return [
    { label: 'Diagnostic complete', done: state.diagnosticCompleted, evidence: state.diagnosticCompleted ? 'Baseline saved' : 'Finish the strategy diagnostic' },
    { label: 'Speaking pressure reps', done: speakingReps >= 3 && audioBackedSpeakingReps >= 1, evidence: `${speakingReps}/3 attempts, ${audioBackedSpeakingReps}/1 recordings` },
    { label: 'Writing timed reps', done: writingReps >= 2, evidence: `${writingReps}/2 drafts` },
    { label: 'Objective accuracy reps', done: objectiveReps >= 6, evidence: `${objectiveReps}/6 reading/listening cards` },
    { label: 'Mini mock complete', done: mockReps >= 1, evidence: `${mockReps}/1 mini mock` },
  ];
}
