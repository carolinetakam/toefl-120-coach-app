import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initialState } from '@/lib/seed';

let dataDir = '';

async function loadStore() {
  dataDir = await mkdtemp(join(tmpdir(), 'toefl-store-'));
  process.env.TOEFL_COACH_DATA_DIR = dataDir;
  delete process.env.TOEFL_COACH_STATE_FILE;
  vi.resetModules();
  return await import('../lib/server-store');
}

afterEach(async () => {
  if (dataDir) await rm(dataDir, { recursive: true, force: true });
  dataDir = '';
});

describe('server-store', () => {
  it('isolates state by client id', async () => {
    const { readServerState, writeServerState } = await loadStore();
    await writeServerState('learner-a', { ...initialState, xp: 120 });
    await writeServerState('learner-b', { ...initialState, xp: 20 });

    await expect(readServerState('learner-a')).resolves.toMatchObject({ xp: 120 });
    await expect(readServerState('learner-b')).resolves.toMatchObject({ xp: 20 });
  });

  it('returns initial state when a client has no file', async () => {
    const { readServerState } = await loadStore();

    await expect(readServerState('new-client')).resolves.toMatchObject({ xp: initialState.xp });
  });

  it('clears only the requested client state', async () => {
    const { clearServerState, readServerState, writeServerState } = await loadStore();
    await writeServerState('learner-a', { ...initialState, xp: 120 });
    await writeServerState('learner-b', { ...initialState, xp: 20 });

    await clearServerState('learner-a');

    await expect(readServerState('learner-a')).resolves.toMatchObject({ xp: initialState.xp });
    await expect(readServerState('learner-b')).resolves.toMatchObject({ xp: 20 });
  });

  it('sanitizes written state', async () => {
    const { readServerState, writeServerState } = await loadStore();

    const saved = await writeServerState('learner-a', { ...initialState, xp: -50 });

    expect(saved.xp).toBe(0);
    await expect(readServerState('learner-a')).resolves.toMatchObject({ xp: 0 });
  });
});
