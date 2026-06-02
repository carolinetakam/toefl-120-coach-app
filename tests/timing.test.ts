import { describe, expect, it } from 'vitest';
import { elapsedSeconds, formatElapsedSeconds } from '@/lib/timing';

describe('timing helpers', () => {
  it('computes elapsed time from wall-clock timestamps', () => {
    expect(elapsedSeconds(1_000, 62_900)).toBe(61);
  });

  it('formats elapsed seconds as a compact clock', () => {
    expect(formatElapsedSeconds(0)).toBe('0:00');
    expect(formatElapsedSeconds(9)).toBe('0:09');
    expect(formatElapsedSeconds(75)).toBe('1:15');
  });
});
