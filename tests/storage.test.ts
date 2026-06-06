import { afterEach, describe, expect, it, vi } from 'vitest';
import { initialState } from '@/lib/seed';
import { toPersistableState } from '@/lib/storage';

function installWindow() {
  const store = new Map<string, string>();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => store.set(key, value)),
      removeItem: vi.fn((key: string) => store.delete(key)),
    },
    crypto: {
      randomUUID: () => 'client-test-id',
    },
  });
  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('storage', () => {
  it('creates a persistable state without temporary speaking audio URLs', () => {
    const state = toPersistableState({
      ...initialState,
      speakingAttempts: [{ promptId: 'speaking-1', selfRating: 4, notes: 'clear answer', hasAudioEvidence: true, audioUrl: 'blob:local-audio' }],
    });

    expect(state.speakingAttempts).toEqual([{ promptId: 'speaking-1', selfRating: 4, notes: 'clear answer', hasAudioEvidence: true, audioUrl: undefined }]);
  });

  it('loadState merges partial local data with safe defaults', async () => {
    const store = installWindow();
    store.set('toefl-120-coach-state', JSON.stringify({ xp: 45, profile: { confidence: { reading: 9 } }, reviewQueue: 'bad' }));
    vi.resetModules();
    const { loadState } = await import('../lib/storage');

    const loaded = loadState();

    expect(loaded.xp).toBe(45);
    expect(loaded.profile.confidence.reading).toBe(5);
    expect(loaded.profile.confidence.listening).toBe(initialState.profile.confidence.listening);
    expect(loaded.reviewQueue).toHaveLength(initialState.reviewQueue.length);
  });

  it('saveState sanitizes values before local persistence', async () => {
    const store = installWindow();
    vi.resetModules();
    const { saveState } = await import('../lib/storage');

    saveState({
      ...initialState,
      xp: -10,
      speakingAttempts: [{ promptId: 'speaking-1', selfRating: 5, notes: 'notes', hasAudioEvidence: true, audioUrl: 'blob:local-audio' }],
    });

    const saved = JSON.parse(store.get('toefl-120-coach-state') ?? '{}');
    expect(saved.xp).toBe(0);
    expect(saved.speakingAttempts[0]).toEqual({ promptId: 'speaking-1', selfRating: 5, notes: 'notes', hasAudioEvidence: true });
  });

  it('persists sanitized mini mock attempts for reload/resume', async () => {
    const store = installWindow();
    vi.resetModules();
    const { saveState, loadState } = await import('../lib/storage');

    saveState({
      ...initialState,
      miniMockAttempts: [
        {
          mockId: 'mock-campus-ecology-1',
          answers: { 'mock-r-1': 0, bad: 99 },
          notes: 'purpose notes',
          speakingNotes: 'finish was clear',
          writing: 'draft',
          rubric: { 'Clear main idea': true },
          submitted: true,
          submittedAt: '2026-06-04T00:00:00.000Z',
          score: 1.4,
          elapsedSeconds: 2000,
          timed: true,
          updatedAt: '2026-06-04T00:00:00.000Z',
        },
      ],
    });

    const loaded = loadState();

    expect(JSON.parse(store.get('toefl-120-coach-state') ?? '{}').miniMockAttempts).toHaveLength(1);
    expect(loaded.miniMockAttempts[0]).toMatchObject({
      mockId: 'mock-campus-ecology-1',
      answers: { 'mock-r-1': 0, bad: 10 },
      notes: 'purpose notes',
      speakingNotes: 'finish was clear',
      writing: 'draft',
      rubric: { 'Clear main idea': true },
      submitted: true,
      score: 1,
      elapsedSeconds: 2000,
      timed: true,
    });
  });

  it('server sync requests reuse a stable client id header', async () => {
    installWindow();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ state: { ...initialState, xp: 12 } }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    vi.resetModules();
    const { loadServerState, saveServerState, resetServerState } = await import('../lib/storage');

    await loadServerState();
    await saveServerState({ ...initialState, xp: 12 });
    await resetServerState();

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/state', {
      cache: 'no-store',
      headers: { 'x-toefl-client-id': 'client-test-id' },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/state',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-toefl-client-id': 'client-test-id' },
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/state', {
      method: 'DELETE',
      headers: { 'x-toefl-client-id': 'client-test-id' },
    });
  });
});
