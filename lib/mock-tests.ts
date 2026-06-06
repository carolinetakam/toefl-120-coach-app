import { Section } from '@/lib/types';
import { evaluateSpeakingAttempt, evaluateWritingAttempt } from '@/lib/scoring';

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
  readingScore: number;
  listeningScore: number;
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
  {
    id: 'mock-river-archive-2',
    title: 'Mini Mock: River Archives',
    minutes: 24,
    listeningScript:
      'In this lecture, the professor explains how river sediment can preserve environmental history. Larger sand layers often show periods of fast water flow, while fine silt can indicate calmer conditions. The professor warns that one layer is not enough evidence by itself. Researchers compare several samples, nearby rainfall records, and plant remains before they make a claim about past floods.',
    speakingPrompt:
      'The professor explains how river sediment helps researchers understand past environments. Summarize the method and explain why one sediment layer is not enough evidence. Prepare briefly, then speak for about 60 seconds.',
    writingPrompt:
      'Academic Discussion: Some history departments want students to work with local archives instead of only reading textbooks. Is archive work worth the extra time? Write 120-180 words with a clear position, one reason, and one concrete example.',
    questions: [
      {
        id: 'mock2-r-1',
        section: 'reading',
        subskill: 'factual detail',
        prompt:
          'A passage says that museum workers digitized handwritten shipping records so researchers could search names, dates, and routes more quickly. Why were the records digitized?',
        choices: [
          'To make the records easier to search',
          'To destroy the original papers',
          'To hide shipping routes from researchers',
          'To replace all museum exhibits',
        ],
        answer: 0,
        explanation: 'The stated purpose is faster searching by names, dates, and routes.',
      },
      {
        id: 'mock2-r-2',
        section: 'reading',
        subskill: 'negative factual information',
        prompt:
          'A passage says early river maps recorded bridge locations, flood marks, and ferry crossings. Which item is NOT mentioned?',
        choices: ['Bridge locations', 'Flood marks', 'Ferry crossings', 'Railroad ticket prices'],
        answer: 3,
        explanation: 'Railroad ticket prices are not part of the listed map details.',
      },
      {
        id: 'mock2-l-1',
        section: 'listening',
        subskill: 'gist',
        prompt: 'What is the main purpose of the lecture?',
        choices: [
          'To explain how sediment evidence can help reconstruct past river conditions',
          'To argue that rainfall records should never be used',
          'To describe how to build a modern bridge',
          'To compare rivers with ocean currents',
        ],
        answer: 0,
        explanation: 'The lecture explains sediment layers as evidence for past environmental conditions.',
      },
      {
        id: 'mock2-l-2',
        section: 'listening',
        subskill: 'detail',
        prompt: 'What does the professor say larger sand layers often show?',
        choices: [
          'Periods of fast water flow',
          'A lack of plant remains',
          'The exact age of every flood',
          'Calmer conditions than fine silt',
        ],
        answer: 0,
        explanation: 'The professor links larger sand layers with faster water flow.',
      },
    ],
  },
  {
    id: 'mock-campus-policy-3',
    title: 'Mini Mock: Campus Policy',
    minutes: 24,
    listeningScript:
      'A student visits an advisor because a new lab policy requires students to reserve equipment online. The student worries that the system will make last-minute projects harder. The advisor explains that reservations prevent conflicts and that emergency slots will remain available. She recommends that the student reserve early for planned work and use emergency slots only when experiments fail unexpectedly.',
    speakingPrompt:
      'The advisor explains a new lab equipment reservation policy. Summarize the student concern and the advisor recommendation in about 60 seconds.',
    writingPrompt:
      'Academic Discussion: Should universities require students to book study rooms in advance, or should rooms stay first-come, first-served? Write 120-180 words with your opinion and one specific example.',
    questions: [
      {
        id: 'mock3-r-1',
        section: 'reading',
        subskill: 'rhetorical purpose',
        prompt:
          'A university notice describes several complaints about crowded study rooms before announcing a reservation system. Why does the notice mention the complaints?',
        choices: [
          'To show the reservation system responds to a specific problem',
          'To prove students should stop studying on campus',
          'To change the topic to housing policy',
          'To criticize one individual student',
        ],
        answer: 0,
        explanation: 'The complaints establish the problem the new system is meant to solve.',
      },
      {
        id: 'mock3-r-2',
        section: 'reading',
        subskill: 'inference',
        prompt:
          'A notice says emergency equipment slots will be held open each afternoon. What is the safest inference?',
        choices: [
          'The department expects some students to need equipment unexpectedly',
          'All planned reservations will be cancelled',
          'Morning labs are no longer allowed',
          'Students can ignore the online system',
        ],
        answer: 0,
        explanation: 'Emergency slots imply that unexpected equipment needs may occur.',
      },
      {
        id: 'mock3-l-1',
        section: 'listening',
        subskill: 'gist',
        prompt: 'What problem does the conversation mainly address?',
        choices: [
          'How to use the new reservation policy without losing flexibility',
          'How to change a major from chemistry to history',
          'Why all equipment will be removed from the lab',
          'Whether the student can skip a final exam',
        ],
        answer: 0,
        explanation: 'The advisor explains how the student can work within the reservation policy.',
      },
      {
        id: 'mock3-l-2',
        section: 'listening',
        subskill: 'function',
        prompt: 'Why does the advisor mention emergency slots?',
        choices: [
          'To show that the new system still handles unexpected experiment problems',
          'To suggest students should never reserve early',
          'To complain about the online system',
          'To announce that planned projects are banned',
        ],
        answer: 0,
        explanation: 'The emergency slots answer the student concern about last-minute problems.',
      },
    ],
  },
  {
    id: 'mock-final-confidence-4',
    title: 'Mini Mock: Final Confidence Run',
    minutes: 22,
    listeningScript:
      'The professor discusses how urban trees affect city temperatures. Trees provide shade, but they also cool air when water evaporates from leaves. The professor gives an example from two nearby streets: the street with older trees stayed cooler during the afternoon. However, she notes that tree type, water access, and building height can change the size of the effect.',
    speakingPrompt:
      'The professor explains two ways urban trees can cool city streets. Summarize the two mechanisms and include the example from the lecture in about 60 seconds.',
    writingPrompt:
      'Academic Discussion: Some cities want to spend more money planting trees on streets instead of building more parking spaces. Which should the city prioritize? Write 120-180 words with one clear reason and one example.',
    questions: [
      {
        id: 'mock4-r-1',
        section: 'reading',
        subskill: 'summary',
        prompt:
          'A paragraph says street trees can lower temperatures, improve walking comfort, and reduce pressure on air-conditioning systems. Which summary is best?',
        choices: [
          'Street trees can create several practical cooling benefits in cities',
          'Air-conditioning systems are no longer used in any city',
          'Walking is impossible without old trees',
          'Only one kind of tree can survive on city streets',
        ],
        answer: 0,
        explanation: 'The best summary captures the broader set of cooling and comfort benefits.',
      },
      {
        id: 'mock4-r-2',
        section: 'reading',
        subskill: 'reference',
        prompt:
          'A passage says, “Trees release water vapor from their leaves, and this can lower nearby air temperature.” What does this refer to?',
        choices: ['The release of water vapor', 'The nearby air temperature', 'The city street', 'The leaves themselves'],
        answer: 0,
        explanation: 'This refers to the event in the previous clause: releasing water vapor.',
      },
      {
        id: 'mock4-l-1',
        section: 'listening',
        subskill: 'detail',
        prompt: 'What two cooling mechanisms does the professor mention?',
        choices: [
          'Shade and evaporation from leaves',
          'Snow storage and underground fans',
          'Traffic reduction and new parking',
          'Paint color and window size only',
        ],
        answer: 0,
        explanation: 'The professor mentions shade and evaporation from leaves.',
      },
      {
        id: 'mock4-l-2',
        section: 'listening',
        subskill: 'organization',
        prompt: 'How is the lecture organized?',
        choices: [
          'Definition of effects, street example, then limits on the effect',
          'Personal story, unrelated joke, then homework directions',
          'List of parking rules only',
          'Historical timeline with no example',
        ],
        answer: 0,
        explanation: 'The lecture explains mechanisms, gives a street comparison, and then qualifies the result.',
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

export function scoreMockAnswersBySection(test: MockTest, answers: Record<string, number>) {
  const sections: Section[] = ['reading', 'listening'];
  return Object.fromEntries(
    sections.map((section) => {
      const questions = test.questions.filter((question) => question.section === section);
      const correct = questions.filter((question) => answers[question.id] === question.answer).length;
      return [section, { correct, total: questions.length, score: questions.length ? correct / questions.length : 0 }];
    }),
  ) as Record<'reading' | 'listening', { correct: number; total: number; score: number }>;
}

export function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateMockWritingScore(test: MockTest, writing: string) {
  return evaluateWritingAttempt(
    {
      id: `${test.id}-writing`,
      section: 'writing',
      title: 'Academic Discussion writing',
      subskill: 'discussion response quality',
      prompt: test.writingPrompt,
      explanation: '',
      xp: 0,
    },
    writing,
    '',
  ).score;
}

export function estimateMockSpeakingScore(test: MockTest, checks: number, notes: string, hasAudioEvidence = false) {
  const checklistSignal = checks >= 3 ? ' clear main idea source detail complete final sentence' : checks >= 2 ? ' clear main idea source detail' : '';
  return evaluateSpeakingAttempt(
    {
      id: `${test.id}-speaking`,
      section: 'speaking',
      title: 'Integrated speaking',
      subskill: 'mock speaking',
      prompt: test.speakingPrompt,
      explanation: '',
      xp: 0,
    },
    Math.max(1, checks + 2),
    `${notes} ${checklistSignal}`,
    hasAudioEvidence,
  ).score;
}

export function evaluateMockAttempt(
  test: MockTest,
  answers: Record<string, number>,
  speakingChecks: number,
  speakingNotes: string,
  writing: string,
  hasSpeakingAudioEvidence = false,
): MockAttemptEvaluation {
  const objective = scoreMockAnswers(test, answers);
  const objectiveBySection = scoreMockAnswersBySection(test, answers);
  const speakingScore = estimateMockSpeakingScore(test, speakingChecks, speakingNotes, hasSpeakingAudioEvidence);
  const writingWords = countWords(writing);
  const writingScore = estimateMockWritingScore(test, writing);
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
    hasSpeakingAudioEvidence
      ? 'Speaking evidence includes a recorded practice attempt.'
      : 'Record one Practice > Speaking attempt before trusting the mock speaking signal.',
    writingWords < 100
      ? `Writing is under target at ${writingWords} words; expand one reason and one example.`
      : 'Writing length is in range; tighten grammar and transitions next.',
  ];

  return {
    objectiveCorrect: objective.correct,
    objectiveTotal: objective.total,
    objectiveScore: objective.score,
    readingScore: objectiveBySection.reading.score,
    listeningScore: objectiveBySection.listening.score,
    speakingScore,
    writingScore,
    writingWords,
    overall,
    feedback: feedbackParts.join(' '),
  };
}
