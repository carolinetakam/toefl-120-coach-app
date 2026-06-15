import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const boundarySource = readFileSync(join(root, 'components/coach-app-boundary.tsx'), 'utf8');
const pageSource = readFileSync(join(root, 'app/page.tsx'), 'utf8');
const coachAppSource = readFileSync(join(root, 'components/coach-app.tsx'), 'utf8');

describe('root app recovery boundary', () => {
  it('wraps the home app before Next route recovery is needed', () => {
    expect(pageSource).toContain('CoachAppBoundary');
    expect(boundarySource).toContain('COACH_APP_RENDER_ERROR');
  });

  it('boots safe mode without deleting cloud data', () => {
    expect(boundarySource).toContain('toefl-120-coach-recovery-mode');
    expect(boundarySource).toContain('window.localStorage.removeItem');
    expect(boundarySource).not.toContain('deleteConvexData');
    expect(coachAppSource).toContain('Safe mode started. Cloud progress was not deleted');
  });

  it('clears local guest recovery state after Clerk signs in', () => {
    expect(coachAppSource).toContain("if (isSignedIn && userId && (!signedOutLocally || guestSession || recoveryMode)) return { status: 'authenticated'");
    expect(coachAppSource).toContain('window.localStorage.removeItem(guestSessionKey)');
    expect(coachAppSource).toContain('window.sessionStorage.removeItem(recoveryModeKey)');
    expect(coachAppSource).toContain("setFeedback('Signed in. Restoring cloud progress now.')");
    expect(coachAppSource).toContain("authState.status === 'authenticated' && (");
  });

  it('checks restored cloud state before replacing the renderable workspace', () => {
    expect(coachAppSource).toContain('function assertRenderableAppState');
    expect(coachAppSource).toContain('if (remoteState) assertRenderableAppState(remoteState);');
    expect(coachAppSource).toContain('CLOUD_RESTORE_RENDER_CHECK_FAILED');
    expect(coachAppSource).toContain("setSaveStatus('Offline')");
  });
});
