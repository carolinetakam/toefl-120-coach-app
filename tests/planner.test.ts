import { describe, expect, it } from 'vitest';
import { generateDailyPlan } from '@/lib/planner';
import { initialState } from '@/lib/seed';

describe('generateDailyPlan', () => {
  it('keeps task minutes within the learner daily budget', () => {
    const state = {
      ...initialState,
      profile: {
        ...initialState.profile,
        dailyMinutes: 20,
      },
    };

    const totalMinutes = generateDailyPlan(state).reduce((total, task) => total + task.minutes, 0);

    expect(totalMinutes).toBeLessThanOrEqual(20);
  });

  it('does not claim due review items when the queue is empty', () => {
    const tasks = generateDailyPlan({ ...initialState, reviewQueue: [] });

    expect(tasks[0].reason).not.toMatch(/due review items/i);
  });
});
