import { mkdir, readFile, rename, rm, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { initialState } from '@/lib/seed';
import { sanitizeAppState } from '@/lib/validation';
import { AppState } from '@/lib/types';

function sanitizeClientId(clientId: string) {
  return clientId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || 'guest';
}

function storePathFor(clientId: string) {
  if (process.env.TOEFL_COACH_STATE_FILE) return process.env.TOEFL_COACH_STATE_FILE;
  const safeClientId = sanitizeClientId(clientId);
  if (process.env.TOEFL_COACH_DATA_DIR) {
    return join(process.env.TOEFL_COACH_DATA_DIR, 'users', safeClientId, 'state.json');
  }
  return join('.data', 'users', safeClientId, 'state.json');
}

export async function readServerState(clientId: string): Promise<AppState> {
  try {
    const raw = await readFile(storePathFor(clientId), 'utf8');
    return sanitizeAppState(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return initialState;
    throw error;
  }
}

export async function writeServerState(clientId: string, state: AppState) {
  const cleanState = sanitizeAppState(state);
  const storePath = storePathFor(clientId);
  await mkdir(dirname(storePath), { recursive: true });
  const tempPath = `${storePath}.${Date.now()}.tmp`;
  await writeFile(tempPath, JSON.stringify(cleanState, null, 2), 'utf8');
  await rename(tempPath, storePath);
  return cleanState;
}

export async function clearServerState(clientId: string) {
  await rm(storePathFor(clientId), { force: true });
}
