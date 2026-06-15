'use client';

import { useEffect } from 'react';
import Link from 'next/link';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('APP_GLOBAL_ERROR', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="shell recoveryShell">
          <section className="panel stack authPrompt" aria-label="App recovery">
            <span className="kicker">Recovery</span>
            <h1>Could not load your TOEFL workspace.</h1>
            <p className="copy">
              The app could not finish loading after sign-in. Retry loading the app, or contact support if it repeats.
            </p>
            <div className="chips centerActions">
              <button className="cta" onClick={reset}>Retry</button>
              <Link className="secondary" href="/">Back to app</Link>
              <Link className="ghost" href="/support">Support</Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
