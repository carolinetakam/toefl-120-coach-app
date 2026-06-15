import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <main className="authPage">
      <section className="authShell" aria-label="Create account">
        <div className="authCopy">
          <span className="kicker">Private beta</span>
          <h1>Create your TOEFL 120 Coach account.</h1>
          <p>Account progress syncs through Clerk and Convex. Guest progress stays only on the current device.</p>
          <div className="authFallbackPanel">
            <p>If the form stays blank, refresh this page once. If it still does not load, continue as guest and tell support your browser.</p>
            <div className="chips">
              <Link className="authFallbackLink" href="/sign-in">Log in instead</Link>
              <Link className="authFallbackLink" href="/">Continue as guest</Link>
            </div>
          </div>
        </div>
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      </section>
    </main>
  );
}
