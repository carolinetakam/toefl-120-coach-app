import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const signInPage = readFileSync(join(root, 'app/sign-in/[[...sign-in]]/page.tsx'), 'utf8');
const signUpPage = readFileSync(join(root, 'app/sign-up/[[...sign-up]]/page.tsx'), 'utf8');
const authEntryPanel = readFileSync(join(root, 'components/auth-entry-panel.tsx'), 'utf8');

describe('auth entry routes', () => {
  it('does not force redirect away from Clerk path callbacks', () => {
    expect(signInPage).not.toContain('forceRedirectUrl');
    expect(signUpPage).not.toContain('forceRedirectUrl');
  });

  it('keeps direct auth-page fallback redirects on the app home page', () => {
    expect(authEntryPanel).toContain('fallbackRedirectUrl="/"');
    expect(authEntryPanel).toContain('path="/sign-in"');
    expect(authEntryPanel).toContain('path="/sign-up"');
  });

  it('keeps passive helper copy while Clerk mounts', () => {
    expect(signInPage).toContain('<AuthEntryPanel mode="sign-in" />');
    expect(signUpPage).toContain('<AuthEntryPanel mode="sign-up" />');
    expect(authEntryPanel).toContain('authPassiveHelper');
    expect(authEntryPanel).toContain('Secure sign-in is loading.');
    expect(authEntryPanel).not.toContain('Sign-in form is still loading.');
  });

  it('starts guest mode through an explicit root query', () => {
    expect(signInPage).toContain('href="/?guest=1"');
    expect(signUpPage).toContain('href="/?guest=1"');
    expect(authEntryPanel).toContain('href="/?guest=1"');
  });
});
