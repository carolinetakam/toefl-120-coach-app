import { diagnosticQuestions, practiceCards } from '@/lib/seed';
import { buildRepairNote, getPracticeCardMetadata } from '@/lib/content-metadata';
import { getLocalDateKey } from '@/lib/dates';
import { AppState, ErrorEntry, PracticeCard, ReviewCard, Section, Track } from '@/lib/types';

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function getTrack(sectionScores: Record<Section, number>): Track {
  const average = Object.values(sectionScores).reduce((sum, value) => sum + value, 0) / 4;
  if (average < 0.55) return 'Foundation';
  if (average < 0.75) return 'High-score';
  if (average < 0.9) return '120 precision';
  return 'Test-readiness';
}

export function scoreDiagnostic(answers: Record<string, number>) {
  const sectionTotals: Record<Section, { correct: number; total: number }> = {
    reading: { correct: 0, total: 0 },
    listening: { correct: 0, total: 0 },
    speaking: { correct: 0, total: 0 },
    writing: { correct: 0, total: 0 },
  };

  const subskillScores: Record<string, number> = {};

  diagnosticQuestions.forEach((question) => {
    const picked = answers[question.id];
    const correct = picked === question.answer ? 1 : 0;
    sectionTotals[question.section].correct += correct;
    sectionTotals[question.section].total += 1;
    subskillScores[question.subskill] = correct;
  });

  const sectionScores = Object.fromEntries(
    Object.entries(sectionTotals).map(([section, value]) => [section, value.total ? value.correct / value.total : 0.5]),
  ) as Record<Section, number>;

  return {
    sectionScores,
    subskillScores,
    track: getTrack(sectionScores),
  };
}

export function getPracticeSet(section: Section) {
  return practiceCards[section];
}

export function prioritizePracticeCards(state: AppState, section: Section) {
  const recentHistory = state.practiceHistory.slice(0, 12);

  return [...practiceCards[section]].sort((a, b) => {
    const aSubskillScore = state.subskillScores[a.subskill] ?? state.sectionScores[section];
    const bSubskillScore = state.subskillScores[b.subskill] ?? state.sectionScores[section];

    const aSeen = state.practiceHistory.filter((entry) => entry.id.startsWith(`${a.id}-`)).length;
    const bSeen = state.practiceHistory.filter((entry) => entry.id.startsWith(`${b.id}-`)).length;

    const aRecentSubskill = recentHistory.filter((entry) => entry.section === section && entry.subskill === a.subskill).length;
    const bRecentSubskill = recentHistory.filter((entry) => entry.section === section && entry.subskill === b.subskill).length;

    if (aSubskillScore !== bSubskillScore) return aSubskillScore - bSubskillScore;
    if (aSeen !== bSeen) return aSeen - bSeen;
    if (aRecentSubskill !== bRecentSubskill) return aRecentSubskill - bRecentSubskill;

    return a.title.localeCompare(b.title);
  });
}

export function buildErrorEntry(card: PracticeCard, correct: boolean): ErrorEntry | null {
  if (correct) return null;
  const metadata = getPracticeCardMetadata(card);

  return {
    id: `${card.id}-${Date.now()}`,
    section: card.section,
    subskill: card.subskill,
    errorType: metadata.questionType,
    prompt: card.title,
    correctInsight: `${card.explanation} ${buildRepairNote(metadata)}`,
    repeatCount: 1,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    lastSeen: new Date().toISOString(),
    corrected: false,
  };
}

export function buildReviewCard(card: PracticeCard): ReviewCard {
  const metadata = getPracticeCardMetadata(card);

  return {
    id: `review-${card.id}-${Date.now()}`,
    section: card.section,
    subskill: card.subskill,
    prompt: `${card.title}: ${card.followUp ?? card.prompt}`,
    answer: `${metadata.cue} ${card.explanation} Repair: ${metadata.repairRule}`,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    interval: 1,
  };
}

export function applyPracticeOutcome(state: AppState, section: Section, subskill: string, score: number, supported = false) {
  const bump = score >= 0.8 ? 0.06 : score >= 0.5 ? 0.02 : -0.04;
  const supportPenalty = supported && score >= 0.8 ? -0.02 : 0;
  return {
    ...state.sectionScores,
    [section]: clamp(state.sectionScores[section] + bump + supportPenalty),
  };
}

export function updateSubskillScores(subskillScores: Record<string, number>, subskill: string, score: number) {
  const current = subskillScores[subskill] ?? 0.5;
  return {
    ...subskillScores,
    [subskill]: clamp(current * 0.65 + score * 0.35),
  };
}

export function readinessScore(state: AppState) {
  const sectionAverage = Object.values(state.sectionScores).reduce((sum, value) => sum + value, 0) / 4;
  const correctedErrors = state.errorLog.filter((entry) => entry.corrected).length;
  const activeErrors = state.errorLog.filter((entry) => !entry.corrected).length;
  const recent = state.practiceHistory.slice(0, 8);
  const recentAverage = recent.length
    ? recent.reduce((sum, entry) => sum + entry.score, 0) / recent.length
    : 0;

  return Math.round(clamp(sectionAverage * 0.45 + recentAverage * 0.35 + correctedErrors * 0.04 - activeErrors * 0.03, 0, 1) * 100);
}

export function updateStreak(lastActiveDate: string) {
  const today = getLocalDateKey();
  if (!lastActiveDate) return 1;
  if (lastActiveDate === today) return null;

  const yesterday = getLocalDateKey(new Date(Date.now() - 1000 * 60 * 60 * 24));
  return lastActiveDate === yesterday ? 'increment' : 'reset';
}

export function nextInterval(interval: number, remembered: boolean) {
  if (!remembered) return 1;
  if (interval === 1) return 3;
  if (interval === 3) return 7;
  return 14;
}
export { getLocalDateKey };
