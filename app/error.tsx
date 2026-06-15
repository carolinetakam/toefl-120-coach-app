'use client';

import { useEffect } from 'react';
import Link from 'next/link';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('APP_ROUTE_ERROR', error);
  }, [error]);

  return (
    <main className="shell recoveryShell">
      <section className="panel stack authPrompt" aria-label="App recovery">
        <span className="kicker">Recovery</span>
        <h1>Could not load your TOEFL workspace.</h1>
        <p className="copy">
          Your account sign-in may have completed, but the app could not restore the workspace in this browser session.
          Retry loading the app, or contact support if it repeats.
        </p>
        <div className="chips centerActions">
          <button className="cta" onClick={reset}>Retry</button>
          <Link className="secondary" href="/">Back to app</Link>
          <Link className="ghost" href="/support">Support</Link>
        </div>
      </section>
    </main>
  );
}
