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
    expect(coachAppSource).toContain("if (isSignedIn && userId) return { status: 'authenticated'");
    expect(coachAppSource).toContain('window.localStorage.removeItem(guestSessionKey)');
    expect(coachAppSource).toContain('window.sessionStorage.removeItem(recoveryModeKey)');
    expect(coachAppSource).toContain("setFeedback('Signed in. Restoring cloud progress now.')");
    expect(coachAppSource).toContain("authState.status === 'authenticated' && (");
  });

  it('routes signed-out root sessions back to the dedicated sign-in page', () => {
    expect(coachAppSource).toContain("if (authState.status !== 'unauthenticated') return;");
    expect(coachAppSource).toContain("window.location.assign('/sign-in')");
    expect(coachAppSource).toContain("url.searchParams.get('guest') !== '1'");
    expect(coachAppSource).toContain("window.history.replaceState(null, '', nextUrl || '/')");
    expect(coachAppSource).toContain("console.log('AUTH_REDIRECT_BEFORE_SIGN_IN'");
  });

  it('waits for Clerk signOut before entering local signed-out mode', () => {
    const handleSignOutSource = coachAppSource.slice(
      coachAppSource.indexOf('async function handleSignOut'),
      coachAppSource.indexOf('function useThreeDaySprint'),
    );
    expect(handleSignOutSource).toContain("console.log('AUTH_LOGOUT_BEFORE'");
    expect(handleSignOutSource).toContain('await signOut();');
    expect(handleSignOutSource).toContain('afterSignOutSnapshot = await waitForClerkSignedOut');
    expect(handleSignOutSource).toContain("console.log('AUTH_LOGOUT_AFTER_SIGNOUT_RESOLVED'");
    expect(handleSignOutSource.indexOf('await signOut();')).toBeLessThan(handleSignOutSource.indexOf('setSignedOutLocally(true);'));
    expect(handleSignOutSource.indexOf('waitForClerkSignedOut')).toBeLessThan(handleSignOutSource.indexOf("window.location.assign('/sign-in')"));
    expect(handleSignOutSource).not.toContain("signOut({ redirectUrl");
  });

  it('uses only the custom logout path inside the app shell', () => {
    expect(coachAppSource).not.toContain('UserButton');
    expect(coachAppSource).not.toContain('afterSignOutUrl');
    expect(coachAppSource).toContain('onClick={handleSignOut}>Logout</button>');
  });

  it('checks restored cloud state before replacing the renderable workspace', () => {
    expect(coachAppSource).toContain('function assertRenderableAppState');
    expect(coachAppSource).toContain('if (remoteState) assertRenderableAppState(remoteState);');
    expect(coachAppSource).toContain('CLOUD_RESTORE_RENDER_CHECK_FAILED');
    expect(coachAppSource).toContain("setSaveStatus('Offline')");
  });

  it('does not mark an empty cloud restore as synced blank progress', () => {
    expect(coachAppSource).toContain('preventBlankCloudOverwriteRef');
    expect(coachAppSource).toContain('No saved cloud progress was found');
    expect(coachAppSource).not.toContain("setSaveStatus('Synced');\n      setSyncReady(true);\n      return;\n    }\n\n    if (authState.status === 'guest')");
  });

  it('hides default profile content while authenticated progress is still restoring', () => {
    expect(coachAppSource).toContain('isRestoringAuthenticatedProgress');
    expect(coachAppSource).toContain("authState.status === 'authenticated' && !syncReady");
    expect(coachAppSource).toContain('Loading your saved TOEFL path.');
  });
});
