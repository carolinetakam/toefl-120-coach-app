import { describe, expect, it } from 'vitest';
import { formatProgressBackup, parseProgressBackup } from '@/lib/backup';
import { buildCoachingProfile } from '@/lib/coaching';
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
  notes: 'contrast notes',
  speakingNotes: 'finished cleanly',
  writing: 'A complete writing response with source control.',
  rubric: { 'Clear main idea': true },
  submitted: true,
  submittedAt: '2026-06-05T00:00:00.000Z',
  score: 0.76,
  elapsedSeconds: 1000,
  timed: true,
  updatedAt: '2026-06-05T00:00:00.000Z',
};

describe('coaching regression flows', () => {
  it('moves from no diagnostic to diagnostic recommendation without fake prediction', () => {
    const profile = buildCoachingProfile(stateWith({
      onboarded: true,
      profile: {
        ...initialState.profile,
        targetScore: 100,
        confidence: { reading: 3, listening: 3, speaking: 2, writing: 3 },
      },
    }), { now: new Date('2026-06-05T00:00:00.000Z') });

    expect(profile.predictionSource).toBe('onboarding');
    expect(profile.confidence).toBe('low');
    expect(profile.nextBestAction.priority).toBe('diagnostic');
  });

  it('prioritizes required repair after diagnostic before optional coaching work', () => {
    const profile = buildCoachingProfile(stateWith({
      onboarded: true,
      diagnosticCompleted: true,
      sectionScores: { reading: 0.8, listening: 0.7, speaking: 0.4, writing: 0.6 },
    }), { now: new Date('2026-06-05T00:00:00.000Z') });

    expect(profile.predictionSource).toBe('diagnostic');
    expect(profile.bottlenecks.length).toBeGreaterThan(0);
    expect(profile.nextBestAction.priority).toBe('required_repair');
  });

  it('uses submitted mini mock evidence for prediction priority', () => {
    const profile = buildCoachingProfile(stateWith({
      onboarded: true,
      diagnosticCompleted: true,
      sectionScores: { reading: 0.2, listening: 0.2, speaking: 0.2, writing: 0.2 },
      miniMockAttempts: [submittedMock],
    }), { now: new Date('2026-06-05T00:00:00.000Z') });

    expect(profile.predictionSource).toBe('mini_mock');
    expect(profile.predictedScore).toBe(92);
    expect(profile.confidence).toBe('high');
  });

  it('clears coaching after reset and regenerates after backup import', () => {
    const completedState = stateWith({
      onboarded: true,
      diagnosticCompleted: true,
      profile: { ...initialState.profile, targetScore: 100 },
      sectionScores: { reading: 0.8, listening: 0.7, speaking: 0.4, writing: 0.6 },
      miniMockAttempts: [submittedMock],
    });
    const restored = parseProgressBackup(formatProgressBackup(completedState, '2026-06-05T00:00:00.000Z'));
    const resetProfile = buildCoachingProfile(initialState, { now: new Date('2026-06-05T00:00:00.000Z') });
    const restoredProfile = buildCoachingProfile(restored, { now: new Date('2026-06-05T00:00:00.000Z') });

    expect(resetProfile.predictionAvailable).toBe(false);
    expect(resetProfile.nextBestAction.priority).toBe('diagnostic');
    expect(restoredProfile.predictionAvailable).toBe(true);
    expect(restoredProfile.predictionSource).toBe('mini_mock');
    expect(restoredProfile.targetScore).toBe(100);
  });
});
