'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import Link from 'next/link';
import { CoachApp } from '@/components/coach-app';

const recoveryModeKey = 'toefl-120-coach-recovery-mode';
const recoveryAttemptedKey = 'toefl-120-coach-recovery-attempted';
const storagePrefix = 'toefl-120-coach';

type CoachAppBoundaryState = {
  error: Error | null;
};

function clearBrowserCoachState() {
  if (typeof window === 'undefined') return;

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(storagePrefix))
    .forEach((key) => window.localStorage.removeItem(key));
  Object.keys(window.sessionStorage)
    .filter((key) => key.startsWith(storagePrefix))
    .forEach((key) => window.sessionStorage.removeItem(key));
}

function enterSafeMode() {
  if (typeof window === 'undefined') return;

  clearBrowserCoachState();
  window.sessionStorage.setItem(recoveryModeKey, '1');
  window.sessionStorage.setItem(recoveryAttemptedKey, '1');
  window.location.assign('/');
}

export class CoachAppBoundary extends Component<{ children?: ReactNode }, CoachAppBoundaryState> {
  state: CoachAppBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): CoachAppBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('COACH_APP_RENDER_ERROR', error, errorInfo);

    if (typeof window === 'undefined') return;
    if (window.sessionStorage.getItem(recoveryAttemptedKey) === '1') return;

    enterSafeMode();
  }

  render() {
    if (!this.state.error) return this.props.children ?? <CoachApp />;

    return (
      <main className="shell recoveryShell">
        <section className="panel stack authPrompt" aria-label="App recovery">
          <span className="kicker">Recovery</span>
          <h1>Could not load your TOEFL workspace.</h1>
          <p className="copy">
            The app hit a saved browser-state error. Open a safe local session now; your signed-in cloud progress is not deleted.
          </p>
          <div className="chips centerActions">
            <button className="cta" onClick={enterSafeMode}>Open safe mode</button>
            <button className="secondary" onClick={() => window.location.reload()}>Retry</button>
            <Link className="ghost" href="/support">Support</Link>
          </div>
        </section>
      </main>
    );
  }
}
