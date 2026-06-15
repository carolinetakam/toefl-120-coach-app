import { describe, expect, it } from 'vitest';
import { detectBottlenecks, getNextBestAction } from '@/lib/coaching';
import { initialState } from '@/lib/seed';
import type { AppState, PracticeResult } from '@/lib/types';

function stateWith(overrides: Partial<AppState>): AppState {
  return {
    ...initialState,
    profile: { ...initialState.profile, testDate: '2099-01-01' },
    sectionScores: { ...initialState.sectionScores },
    ...overrides,
  };
}

function practice(id: string, section: PracticeResult['section'], score = 1): PracticeResult {
  return {
    id,
    section,
    subskill: 'proof',
    score,
    completedAt: '2026-06-03T00:00:00.000Z',
    notes: '',
    supported: true,
  };
}

function completedPathPractice(): PracticeResult[] {
  return [
    practice('pr-s-2-proof', 'speaking'),
    practice('pr-w-4-proof', 'writing'),
    practice('pr-r-1-proof', 'reading'),
    practice('pr-l-5-proof', 'listening'),
    practice('pr-s-4-proof', 'speaking'),
    practice('pr-s-6-proof', 'speaking'),
    practice('pr-w-3-proof', 'writing'),
    practice('pr-w-6-proof', 'writing'),
  ];
}

describe('coaching next action', () => {
  it('recommends diagnostic first when diagnostic is missing', () => {
    const action = getNextBestAction(stateWith({ onboarded: true }), []);

    expect(action.priority).toBe('diagnostic');
    expect(action.title).toMatch(/diagnostic/i);
    expect(action.href).toContain('task=diagnostic');
  });

  it('recommends required repairs before optional bottleneck work', () => {
    const state = stateWith({
      onboarded: true,
      diagnosticCompleted: true,
      sectionScores: { reading: 0.2, listening: 0.9, speaking: 0.9, writing: 0.9 },
    });
    const action = getNextBestAction(state, detectBottlenecks(state));

    expect(action.priority).toBe('required_repair');
    expect(action.title).toBe('Record timed speaking');
  });

  it('recommends largest bottleneck when required path work is already clear', () => {
    const state = stateWith({
      onboarded: true,
      diagnosticCompleted: true,
      sectionScores: { reading: 0.95, listening: 0.95, speaking: 0.2, writing: 0.95 },
      practiceHistory: [
        ...completedPathPractice(),
        practice('speaking-low', 'speaking', 0.3),
      ],
      miniMockAttempts: [
        {
          mockId: 'mock-campus-policy-3',
          answers: {},
          notes: '',
          speakingNotes: '',
          writing: '',
          rubric: {},
          submitted: true,
          submittedAt: '2026-06-03T00:00:00.000Z',
          score: 0.75,
          elapsedSeconds: 1000,
          timed: true,
          updatedAt: '2026-06-03T00:00:00.000Z',
        },
        {
          mockId: 'mock-final-confidence-4',
          answers: {},
          notes: '',
          speakingNotes: '',
          writing: '',
          rubric: {},
          submitted: true,
          submittedAt: '2026-06-04T00:00:00.000Z',
          score: 0.8,
          elapsedSeconds: 1000,
          timed: true,
          updatedAt: '2026-06-04T00:00:00.000Z',
        },
      ],
      reviewQueue: [
        {
          id: 'template-review',
          section: 'speaking',
          subskill: 'template',
          prompt: 'What is the speaking frame?',
          answer: 'Main idea, detail, finish.',
          dueDate: '2026-06-05T00:00:00.000Z',
          interval: 1,
        },
      ],
    });
    const action = getNextBestAction(state, detectBottlenecks(state));

    expect(action.priority).toBe('largest_bottleneck');
    expect(action.section).toBe('speaking');
    expect(action.href).toContain('card=');
  });

  it('always returns one actionable item with the required display fields', () => {
    const action = getNextBestAction(stateWith({ onboarded: true }), []);

    expect(action).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      reason: expect.any(String),
      href: expect.any(String),
      estimatedMinutes: expect.any(Number),
      expectedImpact: expect.any(Number),
      priority: expect.any(String),
      section: expect.any(String),
    });
  });
});
