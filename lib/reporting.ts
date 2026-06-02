import { PracticeCard, ErrorEntry, Section } from '@/lib/types';

export interface RecommendedDrill {
  cardId: string;
  section: Section;
  subskill: string;
  title: string;
  reason: string;
}

function clampScoreSignal(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function estimateSectionBand(scoreSignal: number) {
  return Math.round(clampScoreSignal(scoreSignal) * 30);
}

export function estimateTotalScore(sectionScores: Record<Section, number>) {
  return (Object.keys(sectionScores) as Section[]).reduce((total, section) => total + estimateSectionBand(sectionScores[section]), 0);
}

export function generateBlockerSummary(sectionScores: Record<Section, number>, errorLog: ErrorEntry[]) {
  const lowSections = Object.entries(sectionScores)
    .filter(([, value]) => value < 0.75)
    .map(([section]) => section);
  const repeatedErrors = errorLog.filter((entry) => entry.repeatCount > 1 && !entry.corrected);

  return [
    ...lowSections.map((section) => `${section} is still below elite-consistency range.`),
    ...repeatedErrors.slice(0, 3).map((entry) => `${entry.section} / ${entry.subskill}: ${entry.errorType} repeated ${entry.repeatCount}x.`),
  ].slice(0, 4);
}

export function generateRecommendedDrills(
  cards: PracticeCard[],
  sectionScores: Record<Section, number>,
  subskillScores: Record<string, number>,
  limit = 3,
): RecommendedDrill[] {
  return cards
    .slice()
    .sort((a, b) => {
      const aSubskillScore = subskillScores[a.subskill] ?? sectionScores[a.section];
      const bSubskillScore = subskillScores[b.subskill] ?? sectionScores[b.section];

      if (aSubskillScore !== bSubskillScore) return aSubskillScore - bSubskillScore;
      if (sectionScores[a.section] !== sectionScores[b.section]) return sectionScores[a.section] - sectionScores[b.section];

      return a.title.localeCompare(b.title);
    })
    .slice(0, limit)
    .map((card) => ({
      cardId: card.id,
      section: card.section,
      subskill: card.subskill,
      title: card.title,
      reason: `${card.subskill} is still lagging, so this is the cleanest next drill.`,
    }));
}
