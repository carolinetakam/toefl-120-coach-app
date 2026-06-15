import type { AppState } from '@/lib/types';
import type { Bottleneck, TrendPoint, WeeklyCoachingReport } from './types';
import { predictScore } from './predictions';
import { strongestSection, weakestSection } from './utils';

function startOfWeek(now: Date) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - day);
  return date;
}

function deterministicReportDate(trend: TrendPoint[]) {
  const latestPoint = [...trend].sort((a, b) => b.date.localeCompare(a.date))[0];
  return new Date(`${latestPoint?.date ?? '1970-01-01'}T00:00:00.000Z`);
}

export function buildWeeklyReport(
  appState: AppState,
  trend: TrendPoint[],
  bottlenecks: Bottleneck[],
  options: { now?: Date } = {},
): WeeklyCoachingReport | undefined {
  const now = options.now ?? deterministicReportDate(trend);
  const weekStartDate = startOfWeek(now);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setUTCDate(weekStartDate.getUTCDate() + 6);
  const weekStart = weekStartDate.toISOString().slice(0, 10);
  const weekEnd = weekEndDate.toISOString().slice(0, 10);
  const weeklyPoints = trend.filter((point) => point.date >= weekStart && point.date <= weekEnd);

  if (weeklyPoints.length < 2) return undefined;

  const first = weeklyPoints[0];
  const last = weeklyPoints[weeklyPoints.length - 1];
  const prediction = predictScore(appState);
  const topBottleneck = bottlenecks[0];

  return {
    weekStart,
    weekEnd,
    startingPredictedScore: first.predictedScore,
    endingPredictedScore: last.predictedScore,
    improvement: last.predictedScore - first.predictedScore,
    strongestSection: strongestSection(prediction.sectionScores),
    weakestSection: weakestSection(prediction.sectionScores),
    topBottleneck,
    recommendedFocus: topBottleneck?.recommendedFocus ?? 'Keep completing the current Today mission before adding optional practice.',
  };
}
