import { describe, expect, it } from 'vitest';
import { buildWeeklyReport } from '@/lib/coaching';
import type { Bottleneck, TrendPoint } from '@/lib/coaching';
import { initialState } from '@/lib/seed';

const baseTrendPoint: TrendPoint = {
  date: '2026-06-01',
  predictedScore: 70,
  sectionScores: { reading: 20, listening: 18, speaking: 16, writing: 16 },
};

const topBottleneck: Bottleneck = {
  id: 'speaking-bottleneck',
  section: 'speaking',
  title: 'Speaking fluency',
  description: 'Speaking is the limiter.',
  severity: 7,
  evidenceCount: 3,
  estimatedScoreLoss: 3,
  recommendedFocus: 'Record one timed answer.',
};

describe('coaching weekly report', () => {
  it('returns undefined when weekly data is insufficient', () => {
    const report = buildWeeklyReport(initialState, [baseTrendPoint], [], { now: new Date('2026-06-03T00:00:00.000Z') });

    expect(report).toBeUndefined();
  });

  it('calculates weekly improvement and strongest/weakest sections from current prediction', () => {
    const report = buildWeeklyReport({
      ...initialState,
      diagnosticCompleted: true,
      sectionScores: { reading: 0.9, listening: 0.7, speaking: 0.4, writing: 0.6 },
    }, [
      baseTrendPoint,
      {
        date: '2026-06-05',
        predictedScore: 82,
        sectionScores: { reading: 24, listening: 21, speaking: 18, writing: 19 },
      },
    ], [topBottleneck], { now: new Date('2026-06-05T00:00:00.000Z') });

    expect(report).toMatchObject({
      weekStart: '2026-05-31',
      weekEnd: '2026-06-06',
      startingPredictedScore: 70,
      endingPredictedScore: 82,
      improvement: 12,
      strongestSection: 'reading',
      weakestSection: 'speaking',
      topBottleneck,
      recommendedFocus: 'Record one timed answer.',
    });
  });
});
