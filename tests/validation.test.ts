import { describe, expect, it } from 'vitest';
import { sanitizeAppState } from '@/lib/validation';

describe('sanitizeAppState', () => {
  it('clamps user-controlled values and preserves safe defaults', () => {
    const state = sanitizeAppState({
      profile: {
        targetScore: 140,
        dailyMinutes: -10,
        confidence: {
          reading: 9,
        },
      },
      diagnosticFormId: 'unknown-form',
      sectionScores: {
        reading: 5,
        listening: -1,
      },
      xp: -50,
      reviewQueue: 'bad',
    });

    expect(state.profile.targetScore).toBe(120);
    expect(state.profile.dailyMinutes).toBe(20);
    expect(state.profile.confidence.reading).toBe(5);
    expect(state.diagnosticFormId).toBe('baseline');
    expect(state.sectionScores.reading).toBe(1);
    expect(state.sectionScores.listening).toBe(0);
    expect(state.xp).toBe(0);
    expect(state.reviewQueue).toEqual([]);
  });
});
