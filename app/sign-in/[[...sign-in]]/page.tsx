import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="authPage">
      <section className="authShell" aria-label="Sign in">
        <div className="authCopy">
          <span className="kicker">TOEFL 120 Coach</span>
          <h1>Log in to continue your TOEFL path.</h1>
          <p>Use the same account to restore synced profile, diagnostic, mini mock, review, and progress data.</p>
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
