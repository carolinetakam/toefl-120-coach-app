import { describe, expect, it } from 'vitest';
import { buildProgressBackup, formatProgressBackup, parseProgressBackup } from '@/lib/backup';
import { initialState } from '@/lib/seed';

describe('progress backup', () => {
  it('formats a portable TOEFL 120 Coach backup payload', () => {
    const backup = buildProgressBackup({ ...initialState, xp: 25 }, '2026-06-05T00:00:00.000Z');

    expect(backup).toMatchObject({
      schemaVersion: 1,
      exportedAt: '2026-06-05T00:00:00.000Z',
      app: 'toefl-120-coach',
      state: { xp: 25 },
    });
  });

  it('round-trips exported backup JSON into sanitized app state', () => {
    const rawBackup = formatProgressBackup({
      ...initialState,
      xp: 40,
      profile: { ...initialState.profile, targetScore: 999 },
      speakingAttempts: [{ promptId: 's1', selfRating: 4, notes: 'clear', hasAudioEvidence: true, audioUrl: 'blob:local' }],
    }, '2026-06-05T00:00:00.000Z');

    const restored = parseProgressBackup(rawBackup);

    expect(restored.xp).toBe(40);
    expect(restored.profile.targetScore).toBe(120);
    expect(restored.speakingAttempts[0]).toEqual({
      promptId: 's1',
      selfRating: 4,
      notes: 'clear',
      hasAudioEvidence: true,
      audioUrl: undefined,
    });
  });

  it('still accepts legacy raw-state JSON backups', () => {
    const restored = parseProgressBackup(JSON.stringify({ ...initialState, xp: 12 }));

    expect(restored.xp).toBe(12);
    expect(restored.profile.name).toBe(initialState.profile.name);
  });
});
