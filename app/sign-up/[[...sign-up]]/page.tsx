import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="authPage">
      <section className="authShell" aria-label="Create account">
        <div className="authCopy">
          <span className="kicker">Private beta</span>
          <h1>Create your TOEFL 120 Coach account.</h1>
          <p>Account progress syncs through Clerk and Convex. Guest progress stays only on the current device.</p>
        </div>
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
          forceRedirectUrl="/"
        />
      </section>
    </main>
  );
}
