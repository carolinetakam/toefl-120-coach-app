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
});
