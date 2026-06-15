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
  const clerkRef = useRef<HTMLDivElement | null>(null);
  const [clerkRendered, setClerkRendered] = useState(false);

  useEffect(() => {
    const container = clerkRef.current;
    if (!container) return;

    const checkReady = () => {
      const hasClerkStep = Boolean(
        container.querySelector('form, input, button, [data-clerk-element], [data-localization-key]'),
      );
      setClerkRendered(hasClerkStep);
    };

    checkReady();
    const observer = new MutationObserver(checkReady);
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [mode]);

  const isSignIn = mode === 'sign-in';

  return (
    <div className="authFormSlot" ref={mountRef}>
      <div className="authClerkMount" ref={clerkRef}>
        {isSignIn ? (
          <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
        ) : (
          <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" fallbackRedirectUrl="/" />
        )}
      </div>
      {!clerkRendered && (
        <p className="authPassiveHelper" role="status" aria-live="polite">
          Secure sign-in is loading. If the form stays blank after a refresh, continue as guest and tell support your browser.
        </p>
      )}
      <div className="authPassiveLinks" aria-label="Auth alternatives">
        <Link className="authFallbackLink" href={isSignIn ? '/sign-up' : '/sign-in'}>
          {isSignIn ? 'Create account' : 'Log in instead'}
        </Link>
        <Link className="authFallbackLink" href="/?guest=1">Continue as guest</Link>
      </div>
    </div>
  );
}
