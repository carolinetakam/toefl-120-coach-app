import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="shell stack">
      <section className="panel stack legalPage">
        <Link className="mini" href="/">Back to app</Link>
        <h1>Terms of Use</h1>
        <p className="copy">Last updated: May 18, 2026</p>
        <h2>Educational Practice Tool</h2>
        <p>TOEFL 120 Coach is a practice and planning tool. Scores shown in the app are practice signals, not official TOEFL, ETS, or institutional scores.</p>
        <h2>No Guarantee</h2>
        <p>We do not guarantee admission outcomes, visa outcomes, a specific TOEFL score, or a specific improvement timeline. Your results depend on your study time, baseline ability, test conditions, and outside preparation.</p>
        <h2>User Content</h2>
        <p>You are responsible for the writing drafts, speaking reflections, notes, and imported data you add. Do not upload sensitive personal information that is not needed for practice.</p>
        <h2>Acceptable Use</h2>
        <p>Do not abuse the service, attempt to access another learner&apos;s data, scrape the product, or use the app to misrepresent official test performance.</p>
        <h2>Non-Affiliation</h2>
        <p>TOEFL 120 Coach is not affiliated with, endorsed by, or sponsored by ETS. TOEFL is a trademark of its respective owner.</p>
      </section>
    </main>
  );
}
