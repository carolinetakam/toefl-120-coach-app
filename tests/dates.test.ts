import { describe, expect, it } from 'vitest';
import { dateAfterDays, daysUntil, getLocalDateKey } from '@/lib/dates';

describe('date helpers', () => {
  it('sets stable next-week target dates for the test-week plan', () => {
    expect(dateAfterDays(7, new Date('2026-06-05T09:00:00+09:00'))).toBe('2026-06-12');
  });

  it('uses local calendar days instead of UTC date slicing', () => {
    expect(dateAfterDays(1, new Date(2026, 5, 5, 23, 30))).toBe('2026-06-06');
  });

  it('keeps local date keys and urgency calculations compact', () => {
    const reference = new Date('2026-06-05T09:00:00+09:00');

    expect(getLocalDateKey(reference)).toBe('2026-06-05');
    expect(daysUntil('2026-06-12', reference)).toBe(7);
  });

  it('calculates days left from local calendar dates', () => {
    const lateReference = new Date(2026, 5, 5, 23, 30);

    expect(daysUntil('2026-06-05', lateReference)).toBe(0);
    expect(daysUntil('2026-06-06', lateReference)).toBe(1);
  });
});
