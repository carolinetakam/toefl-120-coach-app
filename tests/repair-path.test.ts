import { describe, expect, it } from 'vitest';
import { getSprintNextAction, requireRepairPracticeCard } from '@/lib/repair-path';
import { initialState } from '@/lib/seed';

describe('sprint repair path', () => {
  it('starts with the first proof set when no mini mock is submitted', () => {
    expect(getSprintNextAction(initialState)).toMatchObject({
      type: 'mock',
      mockId: 'mock-campus-ecology-1',
    });
  });

  it('routes the learner to an exact drill for the latest missed mock subskill', () => {
    const action = getSprintNextAction({
      ...initialState,
      miniMockAttempts: [
        {
          mockId: 'mock-campus-policy-3',
          answers: {
            'mock3-r-1': 1,
            'mock3-r-2': 0,
            'mock3-l-1': 0,
            'mock3-l-2': 0,
          },
          notes: '',
          speakingNotes: '',
          writing: 'draft',
          rubric: {},
          submitted: true,
          submittedAt: '2026-06-04T00:00:00.000Z',
          score: 0.7,
          elapsedSeconds: 1000,
          timed: true,
          updatedAt: '2026-06-04T00:00:00.000Z',
        },
      ],
    });

    expect(action).toMatchObject({
      type: 'practice',
      section: 'reading',
      cardId: 'pr-r-4',
    });
    expect(action.reason).toMatch(/rhetorical purpose/i);
  });

  it('requires recorded speaking evidence after a clean objective mock', () => {
    const action = getSprintNextAction({
      ...initialState,
      miniMockAttempts: [
        {
          mockId: 'mock-campus-ecology-1',
          answers: {
            'mock-r-1': 0,
            'mock-r-2': 2,
            'mock-l-1': 1,
            'mock-l-2': 3,
          },
          notes: '',
          speakingNotes: '',
          writing: 'draft',
          rubric: {},
          submitted: true,
          submittedAt: '2026-06-04T00:00:00.000Z',
          score: 0.9,
          elapsedSeconds: 1000,
          timed: true,
          updatedAt: '2026-06-04T00:00:00.000Z',
        },
      ],
    });

    expect(action).toMatchObject({
      type: 'practice',
      section: 'speaking',
      cardId: 'pr-s-2',
    });
  });

  it('moves to the next proof set after clean objective work and recorded speaking evidence', () => {
    const action = getSprintNextAction({
      ...initialState,
      speakingAttempts: [{ promptId: 'pr-s-2', selfRating: 4, notes: 'clear final sentence', hasAudioEvidence: true }],
      miniMockAttempts: [
        {
          mockId: 'mock-campus-ecology-1',
          answers: {
            'mock-r-1': 0,
            'mock-r-2': 2,
            'mock-l-1': 1,
            'mock-l-2': 3,
          },
          notes: '',
          speakingNotes: '',
          writing: 'draft',
          rubric: {},
          submitted: true,
          submittedAt: '2026-06-04T00:00:00.000Z',
          score: 0.9,
          elapsedSeconds: 1000,
          timed: true,
          updatedAt: '2026-06-04T00:00:00.000Z',
        },
      ],
    });

    expect(action).toMatchObject({
      type: 'mock',
      mockId: 'mock-river-archive-2',
    });
  });

  it('fails loudly when a repair recommendation has no approved practice card mapping', () => {
    expect(() => requireRepairPracticeCard('reading', 'unapproved generated subskill')).toThrow(/Missing approved repair practice card/i);
  });
});
