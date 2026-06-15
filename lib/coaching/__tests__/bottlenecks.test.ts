import { describe, expect, it } from 'vitest';
import { detectBottlenecks } from '@/lib/coaching';
import { initialState } from '@/lib/seed';
import type { AppState, ErrorEntry, ReviewCard } from '@/lib/types';

function stateWith(overrides: Partial<AppState>): AppState {
  return {
    ...initialState,
    sectionScores: { ...initialState.sectionScores },
    ...overrides,
  };
}

function error(id: string, section: ErrorEntry['section'], corrected = false): ErrorEntry {
  return {
    id,
    section,
    subskill: 'repair',
    errorType: 'miss',
    prompt: 'What went wrong?',
    correctInsight: 'Use evidence first.',
    repeatCount: 1,
    dueDate: '2026-06-04T00:00:00.000Z',
    lastSeen: '2026-06-03T00:00:00.000Z',
    corrected,
  };
}

function review(id: string, section: ReviewCard['section']): ReviewCard {
  return {
    id,
    section,
    subskill: 'review',
    prompt: 'What is the repair rule?',
    answer: 'Use the saved correction.',
    dueDate: '2026-06-04T00:00:00.000Z',
    interval: 1,
  };
}

describe('coaching bottlenecks', () => {
  it('returns no bottlenecks when there is no saved evidence', () => {
    expect(detectBottlenecks(initialState)).toEqual([]);
  });

  it('ranks repair-heavy sections first', () => {
    const bottlenecks = detectBottlenecks(stateWith({
      diagnosticCompleted: true,
      sectionScores: { reading: 0.9, listening: 0.8, speaking: 0.8, writing: 0.8 },
      errorLog: [error('r1', 'reading'), error('r2', 'reading'), error('s1', 'speaking')],
      reviewQueue: [review('r-review', 'reading')],
    }));

    expect(bottlenecks[0]).toMatchObject({
      section: 'reading',
      severity: 10,
      estimatedScoreLoss: 4,
    });
  });

  it('caps bottlenecks at three and keeps severity ordering', () => {
    const bottlenecks = detectBottlenecks(stateWith({
      diagnosticCompleted: true,
      sectionScores: { reading: 0.2, listening: 0.3, speaking: 0.4, writing: 0.5 },
      errorLog: [error('r1', 'reading'), error('l1', 'listening'), error('s1', 'speaking'), error('w1', 'writing')],
    }));

    expect(bottlenecks).toHaveLength(3);
    expect(bottlenecks.map((item) => item.severity)).toEqual([...bottlenecks.map((item) => item.severity)].sort((a, b) => b - a));
  });

  it('uses low practice and incomplete speaking/writing signals as evidence', () => {
    const bottlenecks = detectBottlenecks(stateWith({
      practiceHistory: [
        { id: 's-low', section: 'speaking', subskill: 'fluency', score: 0.4, completedAt: '2026-06-03T00:00:00.000Z', notes: '', supported: true },
      ],
      speakingAttempts: [{ promptId: 'pr-s-2', selfRating: 2, notes: 'unfinished', hasAudioEvidence: false }],
      writingDrafts: [{ promptId: 'pr-w-4', draft: 'short', revision: '', score: 0.4 }],
    }));

    expect(bottlenecks.some((item) => item.section === 'speaking')).toBe(true);
    expect(bottlenecks.some((item) => item.section === 'writing')).toBe(true);
  });
});
