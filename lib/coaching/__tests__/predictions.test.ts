import { describe, expect, it } from 'vitest';
import { predictScore } from '@/lib/coaching';
import { initialState } from '@/lib/seed';
import type { AppState, MiniMockAttempt } from '@/lib/types';

function stateWith(overrides: Partial<AppState>): AppState {
  return {
    ...initialState,
    profile: { ...initialState.profile, confidence: { ...initialState.profile.confidence } },
    sectionScores: { ...initialState.sectionScores },
    ...overrides,
  };
}

const submittedMock: MiniMockAttempt = {
  mockId: 'mock-campus-ecology-1',
  answers: {},
  notes: '',
  speakingNotes: '',
  writing: '',
  rubric: {},
  submitted: true,
  submittedAt: '2026-06-03T10:00:00.000Z',
  score: 0.8,
  elapsedSeconds: 900,
  timed: true,
  updatedAt: '2026-06-03T10:00:00.000Z',
};

describe('coaching prediction', () => {
  it('returns unavailable low-confidence prediction when no onboarding or evidence exists', () => {
    const prediction = predictScore(initialState);

    expect(prediction.available).toBe(false);
    expect(prediction.source).toBe('insufficient_data');
    expect(prediction.confidence).toBe('low');
    expect(prediction.predictedScore).toBe(0);
  });

  it('uses onboarding confidence as a low-confidence fallback before diagnostic evidence', () => {
    const prediction = predictScore(stateWith({
      onboarded: true,
      profile: {
        ...initialState.profile,
        confidence: { reading: 5, listening: 4, speaking: 3, writing: 2 },
      },
    }));

    expect(prediction.available).toBe(true);
    expect(prediction.source).toBe('onboarding');
    expect(prediction.confidence).toBe('low');
    expect(prediction.sectionScores).toEqual({ reading: 30, listening: 24, speaking: 18, writing: 12 });
  });

  it('uses diagnostic section scores when diagnostic is complete', () => {
    const prediction = predictScore(stateWith({
      onboarded: true,
      diagnosticCompleted: true,
      sectionScores: { reading: 0.8, listening: 0.7, speaking: 0.6, writing: 0.5 },
    }));

    expect(prediction.source).toBe('diagnostic');
    expect(prediction.confidence).toBe('medium');
    expect(prediction.predictedScore).toBe(78);
  });

  it('prioritizes latest submitted mini mock evidence over diagnostic evidence', () => {
    const prediction = predictScore(stateWith({
      onboarded: true,
      diagnosticCompleted: true,
      sectionScores: { reading: 0.1, listening: 0.1, speaking: 0.1, writing: 0.1 },
      miniMockAttempts: [submittedMock],
    }));

    expect(prediction.source).toBe('mini_mock');
    expect(prediction.confidence).toBe('high');
    expect(prediction.predictedScore).toBe(96);
  });

  it('clamps section scores and total score to TOEFL bands', () => {
    const prediction = predictScore(stateWith({
      onboarded: true,
      diagnosticCompleted: true,
      sectionScores: { reading: 1.5, listening: 1.2, speaking: 2, writing: 1.1 },
    }));

    expect(prediction.sectionScores).toEqual({ reading: 30, listening: 30, speaking: 30, writing: 30 });
    expect(prediction.predictedScore).toBe(120);
  });
});
