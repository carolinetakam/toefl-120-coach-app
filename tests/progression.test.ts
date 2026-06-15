import { describe, expect, it } from 'vitest';
import { dateAfterDays } from '@/lib/dates';
import { initialState } from '@/lib/seed';
import { AppState, PracticeResult } from '@/lib/types';
import { buildPathDayViews, canAccessFullLibrary, canAccessMock, getNextLockedReason, getTodayMission } from '@/lib/progression';

function stateWith(overrides: Partial<AppState>): AppState {
  return {
    ...initialState,
    profile: { ...initialState.profile, testDate: '2099-01-01', dailyMinutes: 60 },
    ...overrides,
  };
}

function practiceResult(id: string, section: PracticeResult['section'] = 'reading'): PracticeResult {
  return {
    id,
    section,
    subskill: 'evidence drill',
    score: 1,
    completedAt: new Date().toISOString(),
    notes: 'completed proof',
    supported: true,
  };
}

describe('progression helpers', () => {
  it('keeps path days locked before the diagnostic is complete', () => {
    const state = stateWith({ onboarded: true, diagnosticCompleted: false });
    const days = buildPathDayViews(state);

    expect(days[0].status).toBe('current');
    expect(days[0].unlockReason).toContain('Finish the strategy diagnostic');
    expect(days.slice(1).every((day) => day.status === 'locked')).toBe(true);
  });

  it('opens day 1 as the current mission after diagnostic completion', () => {
    const state = stateWith({ onboarded: true, diagnosticCompleted: true });
    const days = buildPathDayViews(state);
    const mission = getTodayMission(state);

    expect(days[0].status).toBe('current');
    expect(mission.day).toBe(1);
    expect(mission.primaryActionLabel).toMatch(/Start|Continue/);
  });

  it('locks future days until enough real practice evidence exists', () => {
    const state = stateWith({ onboarded: true, diagnosticCompleted: true });
    const days = buildPathDayViews(state);

    expect(days[1].status).toBe('locked');
    expect(days[1].unlockReason).toBe('Day 2 is locked because 2 required repair exercises are incomplete from Day 1.');
    expect(days[1].missingRequiredActions.map((item) => item.label)).toEqual(['Record timed speaking', 'Write discussion template']);
  });

  it('keeps normal future days locked even after the diagnostic is complete', () => {
    const state = stateWith({
      onboarded: true,
      diagnosticCompleted: true,
      profile: { ...initialState.profile, testDate: dateAfterDays(30), dailyMinutes: 60 },
    });
    const days = buildPathDayViews(state);

    expect(days[0].status).toBe('current');
    expect(days.slice(1).every((day) => day.status === 'locked')).toBe(true);
  });

  it('marks urgent future sprint work as optional without making it the current mission', () => {
    const state = stateWith({
      onboarded: true,
      diagnosticCompleted: true,
      profile: { ...initialState.profile, testDate: dateAfterDays(2), dailyMinutes: 60 },
    });
    const days = buildPathDayViews(state);
    const mission = getTodayMission(state);

    expect(days[0].status).toBe('current');
    expect(days[1].status).toBe('available_optional');
    expect(days[1].unlockReason).toBe('Available as optional sprint work because your test date is close.');
    expect(getNextLockedReason(state, 2)).toBe('Available as optional sprint work because your test date is close.');
    expect(mission.day).toBe(1);
  });

  it('does not count optional future sprint work as completed evidence', () => {
    const state = stateWith({
      onboarded: true,
      diagnosticCompleted: true,
      profile: { ...initialState.profile, testDate: dateAfterDays(1), dailyMinutes: 60 },
    });
    const days = buildPathDayViews(state);

    expect(days[1].status).toBe('available_optional');
    expect(days[2].status).toBe('available_optional');
    expect(days.filter((day) => day.status === 'completed')).toHaveLength(0);
  });

  it('marks earlier days completed from practice evidence and advances the current day', () => {
    const state = stateWith({
      onboarded: true,
      diagnosticCompleted: true,
      practiceHistory: [practiceResult('pr-s-2-proof', 'speaking'), practiceResult('pr-w-4-proof', 'writing')],
    });
    const days = buildPathDayViews(state);

    expect(days[0].status).toBe('completed');
    expect(days[1].status).toBe('current');
  });

  it('does not advance the path from unrelated library practice', () => {
    const state = stateWith({
      onboarded: true,
      diagnosticCompleted: true,
      practiceHistory: [practiceResult('pr-r-4-proof', 'reading')],
    });
    const days = buildPathDayViews(state);
    const mission = getTodayMission(state);

    expect(days[0].status).toBe('current');
    expect(days[1].status).toBe('locked');
    expect(mission.checklist.find((item) => item.label === 'Submit: Record timed speaking')?.done).toBe(false);
  });

  it('lets completed evidence win over urgent optional sprint status', () => {
    const state = stateWith({
      onboarded: true,
      diagnosticCompleted: true,
      profile: { ...initialState.profile, testDate: dateAfterDays(1), dailyMinutes: 60 },
      practiceHistory: [
        practiceResult('pr-s-2-proof', 'speaking'),
        practiceResult('pr-w-4-proof', 'writing'),
        practiceResult('pr-r-1-proof', 'reading'),
        practiceResult('pr-l-5-proof', 'listening'),
        practiceResult('pr-s-4-proof', 'speaking'),
      ],
    });
    const days = buildPathDayViews(state);

    expect(days[0].status).toBe('completed');
    expect(days[1].status).toBe('completed');
    expect(days[2].status).toBe('current');
  });

  it('keeps a fully completed path renderable after signed-in restore', () => {
    const completedPath = stateWith({
      onboarded: true,
      diagnosticCompleted: true,
      practiceHistory: [
        practiceResult('pr-s-2-proof', 'speaking'),
        practiceResult('pr-w-4-proof', 'writing'),
        practiceResult('pr-r-1-proof', 'reading'),
        practiceResult('pr-l-5-proof', 'listening'),
        practiceResult('pr-s-4-proof', 'speaking'),
        practiceResult('pr-s-2-second-proof', 'speaking'),
        practiceResult('pr-w-3-proof', 'writing'),
      ],
      miniMockAttempts: [
        {
          mockId: 'mock-campus-policy-3',
          answers: {},
          notes: '',
          speakingNotes: '',
          writing: '',
          rubric: {},
          submitted: true,
          submittedAt: '2026-06-04T00:00:00.000Z',
          score: 0.8,
          elapsedSeconds: 1000,
          timed: true,
          updatedAt: '2026-06-04T00:00:00.000Z',
        },
        {
          mockId: 'mock-final-confidence-4',
          answers: {},
          notes: '',
          speakingNotes: '',
          writing: '',
          rubric: {},
          submitted: true,
          submittedAt: '2026-06-05T00:00:00.000Z',
          score: 0.85,
          elapsedSeconds: 900,
          timed: true,
          updatedAt: '2026-06-05T00:00:00.000Z',
        },
      ],
      reviewQueue: [
        {
          id: 'review-1',
          section: 'writing',
          subskill: 'structure',
          prompt: 'Review the final template.',
          answer: 'Keep the template concise.',
          dueDate: '2026-06-05T00:00:00.000Z',
          interval: 1,
        },
      ],
    });

    const days = buildPathDayViews(completedPath);
    const mission = getTodayMission(completedPath);

    expect(days.every((day) => day.status === 'completed')).toBe(true);
    expect(mission.title).toBe('Path complete: final review');
    expect(mission.primaryActionLabel).toBe('Review saved misses');
    expect(mission.action).toBeUndefined();
  });

  it('keeps mini mock locked before minimum proof', () => {
    const state = stateWith({ onboarded: true, diagnosticCompleted: true });

    expect(canAccessMock(state).allowed).toBe(false);
    expect(canAccessMock(state).reason).toContain('Complete 2 required repair exercises');
  });

  it('unlocks mini mock after diagnostic and repair evidence', () => {
    const state = stateWith({
      onboarded: true,
      diagnosticCompleted: true,
      practiceHistory: [practiceResult('pr-s-2-proof', 'speaking'), practiceResult('pr-w-4-proof', 'writing')],
      reviewQueue: [
        {
          id: 'review-1',
          section: 'reading',
          subskill: 'evidence drill',
          prompt: 'Review this miss',
          answer: 'Evidence',
          dueDate: new Date().toISOString(),
          interval: 1,
        },
      ],
    });

    expect(canAccessMock(state).allowed).toBe(true);
  });

  it('keeps full library collapsed unless there is diagnostic proof', () => {
    const early = stateWith({ onboarded: true, diagnosticCompleted: false });
    const diagnosed = stateWith({ onboarded: true, diagnosticCompleted: true });
    const emergency = stateWith({ onboarded: true, diagnosticCompleted: false, profile: { ...initialState.profile, testDate: '2000-01-01' } });

    expect(canAccessFullLibrary(early).allowed).toBe(false);
    expect(canAccessFullLibrary(diagnosed).allowed).toBe(true);
    expect(canAccessFullLibrary(emergency).allowed).toBe(false);
    expect(canAccessFullLibrary(emergency).status).toBe('locked');
  });

  it('does not expose optional future path days before diagnostic proof exists', () => {
    const emergency = stateWith({ onboarded: true, diagnosticCompleted: false, profile: { ...initialState.profile, testDate: dateAfterDays(1) } });
    const days = buildPathDayViews(emergency);

    expect(days[0].status).toBe('current');
    expect(days.slice(1).every((day) => day.status === 'locked')).toBe(true);
  });
});
