import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <main className="authPage">
      <section className="authShell" aria-label="Sign in">
        <div className="authCopy">
          <span className="kicker">TOEFL 120 Coach</span>
          <h1>Log in to continue your TOEFL path.</h1>
          <p>Use the same account to restore synced profile, diagnostic, mini mock, review, and progress data.</p>
          <div className="authFallbackPanel">
            <p>If the form stays blank, refresh this page once. If it still does not load, continue as guest and tell support your browser.</p>
            <div className="chips">
              <Link className="authFallbackLink" href="/sign-up">Create account</Link>
              <Link className="authFallbackLink" href="/">Continue as guest</Link>
            </div>
          </div>
        </div>
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
          forceRedirectUrl="/"
        />
      </section>
    </main>
  );
}
