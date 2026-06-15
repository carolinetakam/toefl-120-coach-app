'use client';

import { SignIn, SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type AuthEntryMode = 'sign-in' | 'sign-up';

interface AuthEntryPanelProps {
  mode: AuthEntryMode;
}

export function AuthEntryPanel({ mode }: AuthEntryPanelProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [formReady, setFormReady] = useState(false);
  const [slowLoad, setSlowLoad] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const checkReady = () => {
      const hasClerkForm = Boolean(
        container.querySelector('input[name="identifier"], input[type="email"], input[type="password"], [data-clerk-element]'),
      );
      setFormReady(hasClerkForm);
      if (hasClerkForm) setSlowLoad(false);
    };

    checkReady();
    const observer = new MutationObserver(checkReady);
    observer.observe(container, { childList: true, subtree: true });
    const slowTimer = window.setTimeout(() => {
      if (!container.querySelector('input[name="identifier"], input[type="email"], input[type="password"], [data-clerk-element]')) {
        setSlowLoad(true);
      }
    }, 7000);

    return () => {
      observer.disconnect();
      window.clearTimeout(slowTimer);
    };
  }, [mode]);

  const isSignIn = mode === 'sign-in';

  return (
    <div className="authFormSlot" ref={mountRef}>
      {!formReady && (
        <div className="authLoadingPanel" role="status" aria-live="polite">
          <span className="kicker">Secure account</span>
          <h2>{slowLoad ? 'Sign-in form is still loading.' : 'Loading secure sign-in.'}</h2>
          <p>
            {slowLoad
              ? 'Refresh once, or use the account link below if your browser blocked the secure form.'
              : 'The email form should appear here in a moment.'}
          </p>
          {slowLoad && (
            <div className="chips">
              <Link className="authFallbackLink" href={isSignIn ? '/sign-up' : '/sign-in'}>
                {isSignIn ? 'Create account' : 'Log in instead'}
              </Link>
              <Link className="authFallbackLink" href="/">Continue as guest</Link>
            </div>
          )}
        </div>
      )}
      <div className={formReady ? 'authClerkMount ready' : 'authClerkMount'}>
        {isSignIn ? (
          <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
        ) : (
          <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" fallbackRedirectUrl="/" />
        )}
      </div>
    </div>
  );
}
