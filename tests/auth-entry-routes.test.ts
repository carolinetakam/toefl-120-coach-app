import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const signInPage = readFileSync(join(root, 'app/sign-in/[[...sign-in]]/page.tsx'), 'utf8');
const signUpPage = readFileSync(join(root, 'app/sign-up/[[...sign-up]]/page.tsx'), 'utf8');

describe('auth entry routes', () => {
  it('does not force redirect away from Clerk path callbacks', () => {
    expect(signInPage).not.toContain('forceRedirectUrl');
    expect(signUpPage).not.toContain('forceRedirectUrl');
  });

  it('keeps direct auth-page fallback redirects on the app home page', () => {
    expect(signInPage).toContain('fallbackRedirectUrl="/"');
    expect(signUpPage).toContain('fallbackRedirectUrl="/"');
  });
});
