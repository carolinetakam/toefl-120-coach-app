import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="shell stack">
      <section className="panel stack legalPage">
        <Link className="mini" href="/">Back to app</Link>
        <h1>Privacy Policy</h1>
        <p className="copy">Last updated: May 18, 2026</p>
        <h2>What We Collect</h2>
        <p>TOEFL 120 Coach stores your account email, profile goals, diagnostic answers, practice results, writing drafts, speaking reflections, review cards, and app progress. Guest progress stays in your browser. Signed-in progress syncs through Clerk and Convex.</p>
        <h2>What We Do Not Claim</h2>
        <p>The app does not provide official TOEFL scoring, ETS scoring, immigration advice, admissions advice, or guaranteed score improvement.</p>
        <h2>How Data Is Used</h2>
        <p>Your data is used to personalize practice, estimate practice-readiness signals, restore progress across devices when signed in, troubleshoot support issues, and improve product quality.</p>
        <h2>Data Sharing</h2>
        <p>We use Clerk for authentication and Convex for application data storage. We do not sell learner data. We do not share writing or speaking notes with tutors or third parties unless a future feature asks for explicit consent.</p>
        <h2>Deletion And Export</h2>
        <p>You can export a JSON backup or reset progress from the dashboard. For account deletion or data deletion support, use the support page and include the email used to sign in.</p>
      </section>
    </main>
  );
}
