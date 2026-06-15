import type { AppState } from '@/lib/types';
import type { CoachingProfile } from './types';
import { detectBottlenecks } from './bottlenecks';
import { getNextBestAction } from './next-action';
import { predictScore } from './predictions';
import { buildScoreTrend } from './trend';
import { strongestSection, weakestSection } from './utils';
import { buildWeeklyReport } from './weekly-report';

const deterministicGeneratedAt = new Date(0);

export function buildCoachingProfile(appState: AppState, options: { now?: Date } = {}): CoachingProfile {
  const now = options.now ?? deterministicGeneratedAt;
  const prediction = predictScore(appState);
  const bottlenecks = detectBottlenecks(appState);
  const nextBestAction = getNextBestAction(appState, bottlenecks);
  const scoreTrend = buildScoreTrend(appState, { now });
  const weeklyReport = buildWeeklyReport(appState, scoreTrend, bottlenecks, { now });
  const targetScore = appState.onboarded ? appState.profile.targetScore : undefined;

  return {
    predictionSource: prediction.source,
    predictionAvailable: prediction.available,
    predictedScore: prediction.predictedScore,
    targetScore,
    scoreGap: targetScore === undefined ? undefined : Math.max(0, targetScore - prediction.predictedScore),
    sectionScores: prediction.sectionScores,
    strongestSection: strongestSection(prediction.sectionScores),
    weakestSection: weakestSection(prediction.sectionScores),
    confidence: prediction.confidence,
    bottlenecks,
    nextBestAction,
    scoreTrend,
    weeklyReport,
    generatedAt: now.toISOString(),
  };
}
