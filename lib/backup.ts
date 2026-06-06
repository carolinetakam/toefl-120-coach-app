import { AppState } from '@/lib/types';
import { sanitizeAppState } from '@/lib/validation';

export interface ProgressBackupPayload {
  schemaVersion: 1;
  exportedAt: string;
  app: 'toefl-120-coach';
  state: AppState;
}

export function buildProgressBackup(state: AppState, exportedAt = new Date().toISOString()): ProgressBackupPayload {
  return {
    schemaVersion: 1,
    exportedAt,
    app: 'toefl-120-coach',
    state: sanitizeAppState(state),
  };
}

export function formatProgressBackup(state: AppState, exportedAt?: string) {
  return JSON.stringify(buildProgressBackup(state, exportedAt), null, 2);
}

export function parseProgressBackup(rawBackup: string): AppState {
  const parsed = JSON.parse(rawBackup) as Partial<ProgressBackupPayload> | unknown;
  if (typeof parsed === 'object' && parsed !== null && 'state' in parsed) {
    return sanitizeAppState((parsed as { state: unknown }).state);
  }
  return sanitizeAppState(parsed);
}
