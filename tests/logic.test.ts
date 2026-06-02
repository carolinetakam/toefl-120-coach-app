import { describe, expect, it } from 'vitest';
import { readinessScore } from '@/lib/logic';
import { initialState } from '@/lib/seed';
import { AppState, PracticeResult } from '@/lib/types';

function historyEntry(id: string, score: number): PracticeResult {
  return {
    id,
    section: 'reading',
    subskill: 'inference',
    score,
    completedAt: new Date().toISOString(),
    notes: '',
    supported: false,
  };
}

describe('readinessScore', () => {
  it('starts new users at zero evidence', () => {
    expect(readinessScore(initialState)).toBe(0);
    expect(initialState.sectionScores).toEqual({
      reading: 0,
      listening: 0,
      speaking: 0,
      writing: 0,
    });
    expect(initialState.reviewQueue).toEqual([]);
    expect(initialState.track).toBe('Foundation');
    expect(initialState.profile.confidence).toEqual({
      reading: 0,
      listening: 0,
      speaking: 0,
      writing: 0,
    });
  });

  it('uses newest-first practice history as recent performance', () => {
    const state: AppState = {
      ...initialState,
      sectionScores: {
        reading: 0.5,
        listening: 0.5,
        speaking: 0.5,
        writing: 0.5,
      },
      practiceHistory: [
        ...Array.from({ length: 8 }, (_, index) => historyEntry(`new-${index}`, 1)),
        ...Array.from({ length: 8 }, (_, index) => historyEntry(`old-${index}`, 0)),
      ],
    };

    expect(readinessScore(state)).toBeGreaterThan(55);
  });
});
