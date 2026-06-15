import type { AppState } from '@/lib/types';
import type { TrendPoint } from './types';
import { bandedSectionScores, dateKey } from './utils';

export function buildScoreTrend(appState: AppState, options: { now?: Date } = {}): TrendPoint[] {
  void options.now;
  const points = new Map<string, TrendPoint>();

  for (const entry of appState.practiceHistory) {
    const key = dateKey(entry.completedAt);
    if (!key) continue;
    const sectionScores = bandedSectionScores(appState);
    points.set(key, {
      date: key,
      predictedScore: Math.round(entry.score * 120),
      sectionScores: { ...sectionScores, [entry.section]: Math.round(entry.score * 30) },
    });
  }

  for (const attempt of appState.miniMockAttempts) {
    const key = dateKey(attempt.submittedAt ?? attempt.updatedAt);
    if (!key || !attempt.submitted || typeof attempt.score !== 'number') continue;
    const sectionScore = Math.round(attempt.score * 30);
    points.set(key, {
      date: key,
      predictedScore: Math.round(attempt.score * 120),
      sectionScores: {
        reading: sectionScore,
        listening: sectionScore,
        speaking: sectionScore,
        writing: sectionScore,
      },
    });
  }

  return [...points.values()].sort((a, b) => a.date.localeCompare(b.date));
}
