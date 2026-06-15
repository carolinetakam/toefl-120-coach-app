import { describe, expect, it } from 'vitest';
import { buildScoreTrend } from '@/lib/coaching';
import { initialState } from '@/lib/seed';
import type { AppState, MiniMockAttempt } from '@/lib/types';

function stateWith(overrides: Partial<AppState>): AppState {
  return {
    ...initialState,
    sectionScores: { ...initialState.sectionScores },
    ...overrides,
  };
}

const mockAttempt: MiniMockAttempt = {
  mockId: 'mock-campus-ecology-1',
  answers: {},
  notes: '',
  speakingNotes: '',
  writing: '',
  rubric: {},
  submitted: true,
  submittedAt: '2026-06-05T00:00:00.000Z',
  score: 0.75,
  elapsedSeconds: 1000,
  timed: true,
  updatedAt: '2026-06-05T00:00:00.000Z',
};

describe('coaching score trend', () => {
  it('does not invent trend history for diagnostic-only states', () => {
    const trend = buildScoreTrend(stateWith({
      diagnosticCompleted: true,
      sectionScores: { reading: 0.8, listening: 0.7, speaking: 0.6, writing: 0.5 },
    }));

    expect(trend).toEqual([]);
  });

  it('orders real practice and mini mock points chronologically', () => {
    const trend = buildScoreTrend(stateWith({
      sectionScores: { reading: 0.5, listening: 0.5, speaking: 0.5, writing: 0.5 },
      practiceHistory: [
        { id: 'late', section: 'reading', subskill: 'evidence', score: 0.8, completedAt: '2026-06-04T00:00:00.000Z', notes: '', supported: true },
        { id: 'early', section: 'listening', subskill: 'gist', score: 0.5, completedAt: '2026-06-02T00:00:00.000Z', notes: '', supported: true },
      ],
      miniMockAttempts: [mockAttempt],
    }));

    expect(trend.map((point) => point.date)).toEqual(['2026-06-02', '2026-06-04', '2026-06-05']);
    expect(trend[0].predictedScore).toBe(60);
    expect(trend[2].predictedScore).toBe(90);
  });
});
