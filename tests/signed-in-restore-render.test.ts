// @vitest-environment jsdom

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoachApp } from '@/components/coach-app';
import { initialState } from '@/lib/seed';
import type { AppState } from '@/lib/types';

const restoredState: AppState = {
  ...initialState,
  onboarded: true,
  profile: {
    ...initialState.profile,
    name: 'caroline ',
    targetScore: 120,
    testDate: '2026-06-18',
    dailyMinutes: 60,
  },
  diagnosticFormId: 'fresh-beta',
  diagnosticCompleted: true,
  diagnosticAnswers: {
    l1: 1,
    l2: 2,
    l3: 3,
    l4: 2,
    l5: 3,
    r1: 1,
    r2: 1,
    r3: 1,
    r4: 0,
    r5: 2,
    s1: 0,
    s2: 1,
    s3: 3,
    s4: 0,
    s5: 1,
    w1: 1,
    w2: 0,
    w3: 1,
    w4: 2,
    w5: 1,
    w6: 1,
  },
  sectionScores: {
    reading: 1,
    listening: 0.4,
    speaking: 0.56,
    writing: 0.6666666666666666,
  },
  subskillScores: {
    'clarity/pronunciation': 0,
    coherence: 1,
    detail: 1,
    'discussion response quality': 0,
    'factual detail': 1,
    fluency: 1,
    gist: 1,
    'grammar control': 1,
    inference: 0,
    'integrated synthesis': 1,
    'note-taking quality': 0,
    organization: 0,
    pacing: 1,
    'response structure': 1,
    'rhetorical purpose': 1,
    structure: 1,
    'support quality': 0,
    'timing control': 0.76865,
    'vocabulary in context': 1,
  },
  track: 'High-score',
  xp: 104,
  streak: 1,
  lastActiveDate: '2026-06-15',
  reviewQueue: [
    {
      id: 'review-pr-s-2-1781499948167',
      section: 'speaking',
      subskill: 'timing control',
      prompt: 'Independent: early class or late class',
      answer: 'Cut setup first; protect the final sentence.',
      dueDate: '2026-06-16T05:05:48.167Z',
      interval: 1,
    },
  ],
  practiceHistory: [
    {
      id: 'pr-s-2-1781499948167',
      section: 'speaking',
      subskill: 'timing control',
      score: 0.33899999999999997,
      completedAt: '2026-06-15T05:05:48.167Z',
      notes: '',
      supported: true,
    },
  ],
  speakingAttempts: [
    {
      promptId: 'pr-s-2',
      selfRating: 3,
      notes: '',
      hasAudioEvidence: false,
    },
  ],
  miniMockAttempts: [
    {
      mockId: 'mock-campus-ecology-1',
      answers: {},
      notes: '',
      speakingNotes: '',
      writing: '',
      rubric: {},
      submitted: false,
      elapsedSeconds: 0,
      timed: false,
      updatedAt: '2026-06-15T05:02:01.935Z',
    },
  ],
};

vi.mock('@clerk/nextjs', () => ({
  UserButton: () => React.createElement('span', { 'data-testid': 'user-button' }, 'User'),
  useAuth: () => ({ isLoaded: true, isSignedIn: true, userId: 'user_restore' }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock('convex/react', () => ({
  useQuery: () => ({ state: restoredState }),
  useMutation: () => vi.fn().mockResolvedValue(restoredState),
}));

vi.mock('@/convex/_generated/api', () => ({
  api: {
    coach: {
      getAppState: {},
      saveAppState: {},
      deleteMyData: {},
    },
  },
}));

describe('signed-in cloud restore render', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({ audit: { ready: true, checks: [], blockers: [] } }),
    }));
  });

  it('renders restored signed-in progress without falling into recovery UI', async () => {
    await act(async () => {
      render(React.createElement(CoachApp));
    });

    await waitFor(() => expect(screen.getByText('Cloud sync')).toBeTruthy());
    expect(screen.queryByText('Could not load your TOEFL workspace.')).toBeNull();
    expect(screen.queryByText('Guest learner')).toBeNull();
  });
});
