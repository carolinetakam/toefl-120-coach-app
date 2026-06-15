import { describe, expect, it } from 'vitest';
import { buildCoachingProfile } from '@/lib/coaching';
import { initialState } from '@/lib/seed';

describe('coaching profile', () => {
  it('builds a deterministic empty-state profile without fake prediction data', () => {
    const profile = buildCoachingProfile(initialState, { now: new Date('2026-06-05T00:00:00.000Z') });

    expect(profile.predictionAvailable).toBe(false);
    expect(profile.predictionSource).toBe('insufficient_data');
    expect(profile.targetScore).toBeUndefined();
    expect(profile.scoreTrend).toEqual([]);
    expect(profile.weeklyReport).toBeUndefined();
    expect(profile.generatedAt).toBe('2026-06-05T00:00:00.000Z');
  });

  it('combines prediction, bottlenecks, next action, and trend into one profile', () => {
    const profile = buildCoachingProfile({
      ...initialState,
      onboarded: true,
      diagnosticCompleted: true,
      profile: { ...initialState.profile, targetScore: 100 },
      sectionScores: { reading: 0.8, listening: 0.7, speaking: 0.4, writing: 0.6 },
      practiceHistory: [
        { id: 'pr-s-2-proof', section: 'speaking', subskill: 'fluency', score: 0.5, completedAt: '2026-06-03T00:00:00.000Z', notes: '', supported: true },
        { id: 'pr-w-4-proof', section: 'writing', subskill: 'discussion', score: 0.8, completedAt: '2026-06-04T00:00:00.000Z', notes: '', supported: true },
        { id: 'pr-r-1-proof', section: 'reading', subskill: 'evidence', score: 1, completedAt: '2026-06-04T00:00:00.000Z', notes: '', supported: true },
        { id: 'pr-l-5-proof', section: 'listening', subskill: 'notes', score: 1, completedAt: '2026-06-04T00:00:00.000Z', notes: '', supported: true },
        { id: 'pr-s-4-proof', section: 'speaking', subskill: 'pressure', score: 1, completedAt: '2026-06-04T00:00:00.000Z', notes: '', supported: true },
        { id: 'pr-s-6-proof', section: 'speaking', subskill: 'sources', score: 1, completedAt: '2026-06-04T00:00:00.000Z', notes: '', supported: true },
        { id: 'pr-w-3-proof', section: 'writing', subskill: 'revision', score: 1, completedAt: '2026-06-04T00:00:00.000Z', notes: '', supported: true },
        { id: 'pr-w-6-proof', section: 'writing', subskill: 'integrated', score: 1, completedAt: '2026-06-04T00:00:00.000Z', notes: '', supported: true },
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
          submittedAt: '2026-06-04T00:00:00.000Z',
          score: 0.75,
          elapsedSeconds: 1000,
          timed: true,
          updatedAt: '2026-06-04T00:00:00.000Z',
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
    }, { now: new Date('2026-06-05T00:00:00.000Z') });

    expect(profile.predictionAvailable).toBe(true);
    expect(profile.predictionSource).toBe('mini_mock');
    expect(profile.predictedScore).toBeGreaterThan(0);
    expect(profile.scoreGap).toBe(Math.max(0, 100 - profile.predictedScore));
    expect(profile.sectionScores.reading).toBeGreaterThan(0);
    expect(profile.bottlenecks[0].section).toBe('speaking');
    expect(profile.nextBestAction.priority).toBe('largest_bottleneck');
    expect(profile.scoreTrend).toHaveLength(2);
  });
});
