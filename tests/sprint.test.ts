import { describe, expect, it } from 'vitest';
import { dateAfterDays } from '@/lib/dates';
import { generateSprintPlan, getSprintMode, getSprintReadinessGates, getTodaySprintDay, sectionPlaybooks } from '@/lib/sprint';
import { initialState } from '@/lib/seed';

describe('test-week sprint', () => {
  it('creates a five-day-max proof-driven sprint', () => {
    const plan = generateSprintPlan(initialState);

    expect(plan).toHaveLength(5);
    expect(plan[0].tasks.some((task) => /diagnostic/i.test(task))).toBe(true);
    expect(plan.some((day) => day.sectionFocus.includes('speaking'))).toBe(true);
    expect(plan.some((day) => day.sectionFocus.includes('writing'))).toBe(true);
    expect(plan[2].title).toMatch(/mini mock/i);
    expect(plan[4].title).toMatch(/final/i);
  });

  it('makes every sprint day directly executable inside the app', () => {
    const plan = generateSprintPlan(initialState);

    for (const day of plan) {
      expect(day.actions.length).toBeGreaterThan(0);
      for (const action of day.actions) {
        expect(action.label).toBeTruthy();
        expect(action.reason).toBeTruthy();
        if (action.type === 'practice') {
          expect(action.cardId).toMatch(/^pr-/);
        }
        if (action.type === 'mock') {
          expect(action.mockId).toMatch(/^mock-/);
        }
      }
    }
  });

  it('anchors the three-day emergency sprint on a day-three mini mock proof set', () => {
    const plan = generateSprintPlan(initialState);

    expect(plan[2].actions.some((action) => action.type === 'mock')).toBe(true);
    expect(plan[2].actions.find((action) => action.type === 'mock')?.label).toMatch(/proof/i);
  });

  it('selects the three-day emergency mode for test-week speed prep', () => {
    const state = {
      ...initialState,
      profile: {
        ...initialState.profile,
        testDate: dateAfterDays(3),
      },
    };

    expect(getSprintMode(state)).toBe('3-day emergency sprint');
  });

  it('never presents more than a five-day sprint even when the test is next week', () => {
    const state = {
      ...initialState,
      profile: {
        ...initialState.profile,
        testDate: dateAfterDays(7),
      },
    };

    expect(generateSprintPlan(state)).toHaveLength(5);
    expect(getSprintMode(state)).toBe('5-day sprint + maintenance');
  });

  it('starts the three-day sprint at day one when three days remain', () => {
    const state = {
      ...initialState,
      profile: {
        ...initialState.profile,
        testDate: '2026-06-07',
      },
    };

    const today = getTodaySprintDay(state, new Date('2026-06-04T09:00:00+09:00'));

    expect(today.title).toBe('Baseline and templates');
  });

  it('advances the five-day sprint before switching into the three-day emergency sequence', () => {
    const state = {
      ...initialState,
      profile: {
        ...initialState.profile,
        testDate: '2026-06-09',
      },
    };

    expect(getTodaySprintDay(state, new Date('2026-06-04T09:00:00+09:00')).day).toBe(1);
    expect(getTodaySprintDay(state, new Date('2026-06-05T09:00:00+09:00')).day).toBe(2);
    expect(getTodaySprintDay(state, new Date('2026-06-06T09:00:00+09:00')).day).toBe(1);
  });

  it('tracks proof gates that show whether the app is preparing a real learner', () => {
    const gates = getSprintReadinessGates({
      ...initialState,
      diagnosticCompleted: true,
      practiceHistory: [
        { id: 'r1', section: 'reading', subskill: 'factual', score: 1, completedAt: '2026-06-04', notes: '', supported: false },
        { id: 'l1', section: 'listening', subskill: 'gist', score: 1, completedAt: '2026-06-04', notes: '', supported: false },
      ],
      speakingAttempts: [{ promptId: 's1', selfRating: 4, notes: 'clear finish', hasAudioEvidence: false }],
      writingDrafts: [{ promptId: 'w1', draft: 'draft', revision: 'revision', score: 0.8 }],
    });

    expect(gates.find((gate) => gate.label === 'Diagnostic complete')?.done).toBe(true);
    expect(gates.find((gate) => gate.label === 'Speaking pressure reps')?.evidence).toBe('1/3 attempts, 0/1 recordings');
    expect(gates.find((gate) => gate.label === 'Mini mock complete')?.done).toBe(false);
  });

  it('requires at least one recorded speaking attempt before the speaking proof gate passes', () => {
    const baseAttempts = [
      { promptId: 's1', selfRating: 4, notes: 'clear finish', hasAudioEvidence: false },
      { promptId: 's2', selfRating: 4, notes: 'clear finish', hasAudioEvidence: false },
      { promptId: 's3', selfRating: 4, notes: 'clear finish', hasAudioEvidence: false },
    ];

    expect(getSprintReadinessGates({ ...initialState, speakingAttempts: baseAttempts }).find((gate) => gate.label === 'Speaking pressure reps')?.done).toBe(false);
    expect(getSprintReadinessGates({ ...initialState, speakingAttempts: [{ ...baseAttempts[0], hasAudioEvidence: true }, ...baseAttempts.slice(1)] }).find((gate) => gate.label === 'Speaking pressure reps')?.done).toBe(true);
  });

  it('includes test-week templates for all sections', () => {
    expect(sectionPlaybooks.speaking.template.join(' ')).toMatch(/Personally/);
    expect(sectionPlaybooks.writing.template.join(' ')).toMatch(/position/);
    expect(sectionPlaybooks.reading.winCondition).toMatch(/text/i);
    expect(sectionPlaybooks.listening.noteFormat).toContain('Contrast or attitude');
  });
});
