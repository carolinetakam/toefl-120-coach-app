import { mockTests } from '@/lib/mock-tests';
import { practiceCards } from '@/lib/seed';
import { AppState, MiniMockAttempt, PracticeCard, Section } from '@/lib/types';

export type SprintNextAction =
  | {
      type: 'practice';
      title: string;
      reason: string;
      section: Section;
      cardId: string;
    }
  | {
      type: 'mock';
      title: string;
      reason: string;
      mockId: string;
    };

function latestSubmittedMockAttempt(attempts: MiniMockAttempt[]) {
  return attempts
    .filter((attempt) => attempt.submitted)
    .slice()
    .sort((a, b) => new Date(b.submittedAt ?? b.updatedAt).getTime() - new Date(a.submittedAt ?? a.updatedAt).getTime())[0];
}

function findPracticeCard(section: Section, subskill: string): PracticeCard {
  return practiceCards[section].find((card) => card.subskill === subskill) ?? practiceCards[section][0];
}

function firstUnsubmittedMock(state: AppState) {
  return mockTests.find((mock) => !state.miniMockAttempts.some((attempt) => attempt.mockId === mock.id && attempt.submitted));
}

function weakestSectionCard(state: AppState): PracticeCard {
  const weakest = (Object.entries(state.sectionScores).sort((a, b) => a[1] - b[1])[0]?.[0] ?? 'speaking') as Section;
  return practiceCards[weakest][0];
}

export function getSprintNextAction(state: AppState): SprintNextAction {
  const latestAttempt = latestSubmittedMockAttempt(state.miniMockAttempts);

  if (latestAttempt) {
    const mock = mockTests.find((item) => item.id === latestAttempt.mockId);
    const missedQuestion = mock?.questions.find((question) => latestAttempt.answers[question.id] !== question.answer);

    if (missedQuestion) {
      const card = findPracticeCard(missedQuestion.section, missedQuestion.subskill);
      return {
        type: 'practice',
        title: card.title,
        reason: `Repair the ${missedQuestion.subskill} miss from ${mock?.title ?? 'the latest mini mock'} before taking another proof set.`,
        section: card.section,
        cardId: card.id,
      };
    }

    if (!state.speakingAttempts.some((attempt) => attempt.hasAudioEvidence)) {
      const card = findPracticeCard('speaking', 'timing control');
      return {
        type: 'practice',
        title: card.title,
        reason: 'Your latest mock has no recorded speaking evidence. Record one timed answer before trusting speaking readiness.',
        section: card.section,
        cardId: card.id,
      };
    }

    const nextMock = firstUnsubmittedMock(state);
    if (nextMock) {
      return {
        type: 'mock',
        title: nextMock.title,
        reason: 'Your latest proof set is complete. Move to the next approved mini mock for a fresh signal.',
        mockId: nextMock.id,
      };
    }

    const card = weakestSectionCard(state);
    return {
      type: 'practice',
      title: card.title,
      reason: 'All approved mini mocks are complete. Keep sharpening the weakest section and review saved repairs.',
      section: card.section,
      cardId: card.id,
    };
  }

  const inProgressAttempt = state.miniMockAttempts
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  const inProgressMock = inProgressAttempt ? mockTests.find((mock) => mock.id === inProgressAttempt.mockId) : undefined;
  const nextMock = inProgressMock ?? firstUnsubmittedMock(state) ?? mockTests[0];

  return {
    type: 'mock',
    title: nextMock.title,
    reason: inProgressAttempt ? 'Resume the saved proof set and finish the completion signal.' : 'Start the first approved proof set after diagnostic.',
    mockId: nextMock.id,
  };
}
