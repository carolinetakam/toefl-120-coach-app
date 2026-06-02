import { initialState } from '@/lib/seed';
import { AppState } from '@/lib/types';
import { sanitizeAppState } from '@/lib/validation';

const STORAGE_KEY = 'toefl-120-coach-state';
const CLIENT_ID_KEY = 'toefl-120-coach-client-id';

function getClientId() {
  if (typeof window === 'undefined') return 'server';
  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;

  const next = typeof window.crypto?.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(CLIENT_ID_KEY, next);
  return next;
}

function stateHeaders() {
  return {
    'x-toefl-client-id': getClientId(),
  };
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return initialState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<AppState>;

    return sanitizeAppState({
      ...initialState,
      ...parsed,
      profile: {
        ...initialState.profile,
        ...parsed.profile,
        confidence: {
          ...initialState.profile.confidence,
          ...parsed.profile?.confidence,
        },
      },
      sectionScores: {
        ...initialState.sectionScores,
        ...parsed.sectionScores,
      },
      subskillScores: {
        ...initialState.subskillScores,
        ...parsed.subskillScores,
      },
      diagnosticAnswers: {
        ...initialState.diagnosticAnswers,
        ...parsed.diagnosticAnswers,
      },
      reviewQueue: Array.isArray(parsed.reviewQueue) ? parsed.reviewQueue : initialState.reviewQueue,
      errorLog: Array.isArray(parsed.errorLog) ? parsed.errorLog : initialState.errorLog,
      practiceHistory: Array.isArray(parsed.practiceHistory) ? parsed.practiceHistory : initialState.practiceHistory,
      writingDrafts: Array.isArray(parsed.writingDrafts) ? parsed.writingDrafts : initialState.writingDrafts,
      speakingAttempts: Array.isArray(parsed.speakingAttempts)
        ? parsed.speakingAttempts.map((entry) => ({ ...entry, audioUrl: undefined }))
        : initialState.speakingAttempts,
    });
  } catch {
    return initialState;
  }
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersistableState(state)));
  } catch {
    // Browser storage can be disabled or full; server sync/export still keep the app usable.
  }
}

export function toPersistableState(state: AppState): AppState {
  return sanitizeAppState({
    ...state,
    speakingAttempts: state.speakingAttempts.map((entry) => ({
      promptId: entry.promptId,
      selfRating: entry.selfRating,
      notes: entry.notes,
    })),
  });
}

export function resetState() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export async function loadServerState(): Promise<AppState> {
  const response = await fetch('/api/state', { cache: 'no-store', headers: stateHeaders() });
  if (!response.ok) throw new Error('Unable to load server state.');
  const payload = (await response.json()) as { state: unknown };
  return sanitizeAppState(payload.state);
}

export async function saveServerState(state: AppState): Promise<AppState> {
  const response = await fetch('/api/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...stateHeaders() },
    body: JSON.stringify(toPersistableState(state)),
  });
  if (!response.ok) throw new Error('Unable to save server state.');
  const payload = (await response.json()) as { state: unknown };
  return sanitizeAppState(payload.state);
}

export async function resetServerState() {
  const response = await fetch('/api/state', { method: 'DELETE', headers: stateHeaders() });
  if (!response.ok) throw new Error('Unable to reset server state.');
}
