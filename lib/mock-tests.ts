import { Section } from '@/lib/types';

export interface MockQuestion {
  id: string;
  section: Section;
  subskill: string;
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
}

export interface MockTest {
  id: string;
  title: string;
  minutes: number;
  listeningScript: string;
  speakingPrompt: string;
  writingPrompt: string;
  questions: MockQuestion[];
}

export interface MockAttemptEvaluation {
  objectiveCorrect: number;
  objectiveTotal: number;
  objectiveScore: number;
  speakingScore: number;
  writingScore: number;
  writingWords: number;
  overall: number;
  feedback: string;
}

export const mockTests: MockTest[] = [
  {
    id: 'mock-campus-ecology-1',
    title: 'Mini Mock: Campus Ecology',
    minutes: 24,
    listeningScript:
      'In today’s lecture, the professor explains ecological succession on abandoned farmland. First, fast-growing grasses appear because they tolerate exposed soil and direct sunlight. Later, shrubs and young trees create shade, changing the conditions for new species. The professor emphasizes that succession is not a simple return to the past. Human activity, seed availability, and soil chemistry can all change the final plant community.',
    speakingPrompt:
      'The professor describes ecological succession on abandoned farmland. Explain the process and include the reason the final plant community may differ from the original one. Prepare briefly, then speak for about 60 seconds.',
    writingPrompt:
      'Academic Discussion: Some universities are replacing large lecture courses with smaller discussion-based classes. Is this change worth the extra cost? Write 120-180 words with a clear position, one reason, and one concrete example.',
    questions: [
      {
        id: 'mock-r-1',
        section: 'reading',
        subskill: 'inference',
        prompt:
          'A passage says that newly abandoned farmland first supports grasses, then shrubs, and eventually young trees. What is the safest inference?',
        choices: [
          'Plant communities can change in stages over time',
          'Trees always disappear permanently after farming',
          'Farmers intentionally plant all later species',
          'Soil chemistry has no effect on plant growth',
        ],
        answer: 0,
        explanation: 'The staged sequence supports a careful inference about plant community change over time.',
      },
      {
        id: 'mock-r-2',
        section: 'reading',
        subskill: 'rhetorical purpose',
        prompt:
          'Why would an author mention both seed availability and soil chemistry when discussing succession?',
        choices: [
          'To prove succession follows one fixed path',
          'To argue that plants do not need soil',
          'To show that multiple factors influence the final community',
          'To shift from ecology to economics',
        ],
        answer: 2,
        explanation: 'The examples broaden the causal explanation and prevent an oversimplified view.',
      },
      {
        id: 'mock-l-1',
        section: 'listening',
        subskill: 'gist',
        prompt: 'What is the main point of the lecture?',
        choices: [
          'Abandoned farmland immediately returns to its exact original forest',
          'Succession on abandoned farmland can unfold in stages and end differently depending on conditions',
          'Human activity has no relationship to plant communities',
          'Grasses prevent all future plant growth',
        ],
        answer: 1,
        explanation: 'The lecture explains a staged process and stresses that final outcomes can vary.',
      },
      {
        id: 'mock-l-2',
        section: 'listening',
        subskill: 'detail',
        prompt: 'Why do grasses usually appear first?',
        choices: [
          'They require deep shade',
          'They are planted by every farmer',
          'They grow only after mature trees return',
          'They tolerate exposed soil and direct sunlight',
        ],
        answer: 3,
        explanation: 'The professor states that early grasses tolerate exposed soil and direct sunlight.',
      },
    ],
  },
];

export function scoreMockAnswers(test: MockTest, answers: Record<string, number>) {
  const correct = test.questions.filter((question) => answers[question.id] === question.answer).length;
  return {
    correct,
    total: test.questions.length,
    score: test.questions.length ? correct / test.questions.length : 0,
  };
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function keywordCoverage(value: string, keywords: string[]) {
  const normalized = value.toLowerCase();
  return keywords.filter((keyword) => normalized.includes(keyword)).length / keywords.length;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function estimateMockWritingScore(writing: string) {
  const words = countWords(writing);
  const lengthScore = words >= 120 && words <= 180 ? 1 : words >= 100 && words <= 220 ? 0.82 : words >= 60 ? 0.58 : 0.25;
  const positionScore = /\b(i think|i believe|in my opinion|universities should|this change is|worth)\b/i.test(writing) ? 1 : 0.35;
  const supportScore = keywordCoverage(writing, ['because', 'example']);
  const relevanceScore = keywordCoverage(writing, ['class', 'student', 'discussion']);
  const sentenceCount = writing.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 8).length;
  const developmentScore = sentenceCount >= 5 ? 1 : sentenceCount >= 3 ? 0.65 : 0.3;
  const repeatedErrors = [
    /\bmany student\b/i,
    /\bstudent speak\b/i,
    /\bteacher know\b/i,
    /\beven it is\b/i,
  ].filter((pattern) => pattern.test(writing)).length;
  const mechanicsPenalty = repeatedErrors * 0.05;

  return clamp(
    lengthScore * 0.25 + positionScore * 0.15 + supportScore * 0.2 + relevanceScore * 0.2 + developmentScore * 0.2 - mechanicsPenalty,
  );
}

export function estimateMockSpeakingScore(checks: number, notes: string) {
  const sourceDetail = keywordCoverage(notes, ['grass', 'tree', 'soil']);
  const clarityScore = checks / 3;
  const reflectionScore = notes.trim().split(/\s+/).filter(Boolean).length >= 12 ? 1 : 0.45;

  return clamp(0.35 + clarityScore * 0.25 + sourceDetail * 0.25 + reflectionScore * 0.15);
}

export function evaluateMockAttempt(
  test: MockTest,
  answers: Record<string, number>,
  speakingChecks: number,
  speakingNotes: string,
  writing: string,
): MockAttemptEvaluation {
  const objective = scoreMockAnswers(test, answers);
  const speakingScore = estimateMockSpeakingScore(speakingChecks, speakingNotes);
  const writingWords = countWords(writing);
  const writingScore = estimateMockWritingScore(writing);
  const overall = Math.round((objective.score * 0.55 + speakingScore * 0.2 + writingScore * 0.25) * 100);
  const missedSubskills = test.questions
    .filter((question) => answers[question.id] !== question.answer)
    .map((question) => question.subskill);
  const feedbackParts = [
    missedSubskills.length
      ? `Review ${Array.from(new Set(missedSubskills)).join(', ')} before the next mock.`
      : 'Objective accuracy is stable; raise time pressure next.',
    speakingScore < 0.78
      ? 'Redo speaking with one source detail and a complete final sentence.'
      : 'Speaking checklist is acceptable; now reduce pauses.',
    writingWords < 100
      ? `Writing is under target at ${writingWords} words; expand one reason and one example.`
      : 'Writing length is in range; tighten grammar and transitions next.',
  ];

  return {
    objectiveCorrect: objective.correct,
    objectiveTotal: objective.total,
    objectiveScore: objective.score,
    speakingScore,
    writingScore,
    writingWords,
    overall,
    feedback: feedbackParts.join(' '),
  };
}
