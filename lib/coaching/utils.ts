import type { AppState, Section } from '@/lib/types';
import type { SectionScores } from './types';

export const sections: Section[] = ['reading', 'listening', 'speaking', 'writing'];

export const sectionLabels: Record<Section, string> = {
  reading: 'Reading',
  listening: 'Listening',
  speaking: 'Speaking',
  writing: 'Writing',
};

export function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function sectionBand(scoreSignal: number) {
  return Math.round(clamp(scoreSignal, 0, 1) * 30);
}

export function totalFromSections(sectionScores: SectionScores) {
  return clamp(sections.reduce((sum, section) => sum + sectionScores[section], 0), 0, 120);
}

export function bandedSectionScores(state: AppState): SectionScores {
  return {
    reading: sectionBand(state.sectionScores.reading),
    listening: sectionBand(state.sectionScores.listening),
    speaking: sectionBand(state.sectionScores.speaking),
    writing: sectionBand(state.sectionScores.writing),
  };
}

export function sectionAverage(state: AppState, section: Section) {
  const history = state.practiceHistory.filter((entry) => entry.section === section);
  if (!history.length) return state.sectionScores[section] || 0;
  return history.reduce((sum, entry) => sum + entry.score, 0) / history.length;
}

export function strongestSection(sectionScores: SectionScores): Section {
  return [...sections].sort((a, b) => sectionScores[b] - sectionScores[a])[0];
}

export function weakestSection(sectionScores: SectionScores): Section {
  return [...sections].sort((a, b) => sectionScores[a] - sectionScores[b])[0];
}

export function severityToScoreLoss(severity: number) {
  if (severity >= 9) return 4;
  if (severity >= 7) return 3;
  if (severity >= 4) return 2;
  return 1;
}

export function dateKey(value: string | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}
