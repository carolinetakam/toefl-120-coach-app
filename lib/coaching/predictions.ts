import type { AppState } from '@/lib/types';
import type { CoachingConfidence, PredictionSource, SectionScores } from './types';
import { bandedSectionScores, clamp, sectionBand, sections, totalFromSections } from './utils';

function hasSubmittedMiniMock(state: AppState) {
  return state.miniMockAttempts.some((attempt) => attempt.submitted && typeof attempt.score === 'number');
}

function miniMockSectionScores(state: AppState): SectionScores | undefined {
  const attempts = state.miniMockAttempts.filter((attempt) => attempt.submitted && typeof attempt.score === 'number');
  if (!attempts.length) return undefined;
  const latest = attempts.sort((a, b) => new Date(b.submittedAt ?? b.updatedAt).getTime() - new Date(a.submittedAt ?? a.updatedAt).getTime())[0];
  const overall = clamp(latest.score ?? 0, 0, 1);
  const sectionScore = sectionBand(overall);

  return {
    reading: sectionScore,
    listening: sectionScore,
    speaking: sectionScore,
    writing: sectionScore,
  };
}

function practiceSectionScores(state: AppState): SectionScores | undefined {
  if (!state.practiceHistory.length) return undefined;
  const scores = bandedSectionScores(state);
  for (const section of sections) {
    const entries = state.practiceHistory.filter((entry) => entry.section === section);
    if (!entries.length) continue;
    const average = entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length;
    scores[section] = sectionBand(average);
  }
  return scores;
}

function onboardingSectionScores(state: AppState): SectionScores | undefined {
  if (!state.onboarded) return undefined;
  return {
    reading: sectionBand(state.profile.confidence.reading / 5),
    listening: sectionBand(state.profile.confidence.listening / 5),
    speaking: sectionBand(state.profile.confidence.speaking / 5),
    writing: sectionBand(state.profile.confidence.writing / 5),
  };
}

export function predictScore(appState: AppState): {
  predictedScore: number;
  sectionScores: SectionScores;
  confidence: CoachingConfidence;
  source: PredictionSource;
  available: boolean;
} {
  const miniMockScores = miniMockSectionScores(appState);
  const practiceScores = practiceSectionScores(appState);
  const onboardingScores = onboardingSectionScores(appState);
  const evidence =
    (miniMockScores ? { source: 'mini_mock' as const, scores: miniMockScores } : undefined)
    ?? (appState.diagnosticCompleted ? { source: 'diagnostic' as const, scores: bandedSectionScores(appState) } : undefined)
    ?? (practiceScores ? { source: 'practice' as const, scores: practiceScores } : undefined)
    ?? (onboardingScores ? { source: 'onboarding' as const, scores: onboardingScores } : undefined);
  const sectionScores = evidence?.scores ?? { reading: 0, listening: 0, speaking: 0, writing: 0 };

  const confidence: CoachingConfidence = appState.diagnosticCompleted && hasSubmittedMiniMock(appState)
    ? 'high'
    : appState.diagnosticCompleted || appState.practiceHistory.length > 0
      ? 'medium'
      : 'low';

  return {
    predictedScore: totalFromSections(sectionScores),
    sectionScores,
    confidence,
    source: evidence?.source ?? 'insufficient_data',
    available: Boolean(evidence),
  };
}
