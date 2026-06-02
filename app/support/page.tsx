import Link from 'next/link';

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

export default function SupportPage() {
  const mailto = supportEmail
    ? `mailto:${supportEmail}?subject=TOEFL%20120%20Coach%20support&body=Account%20email%3A%0ADevice%2Fbrowser%3A%0ASigned%20in%20or%20guest%20mode%3A%0ALast%20step%20completed%3A%20onboarding%20%2F%20diagnostic%20%2F%20mini%20mock%20%2F%20daily%20plan%20%2F%20export%20%2F%20reset%0AExpected%20result%3A%0AActual%20result%3A%0AScreenshot%20or%20screen%20recording%3A`
    : undefined;

  return (
    <main className="shell stack">
      <section className="panel stack legalPage">
        <Link className="mini" href="/">Back to app</Link>
        <h1>Support</h1>
        <p className="copy">Use this page for beta support, account deletion, data deletion, bugs, and scoring questions.</p>
        {mailto ? (
          <div className="sectionCard stack">
            <h2>Email Support</h2>
            <p>{supportEmail}</p>
            <a className="cta legalAction" href={mailto}>Open email</a>
          </div>
        ) : (
          <div className="sectionCard stack">
            <h2>Support Email Not Configured</h2>
            <p>Set `NEXT_PUBLIC_SUPPORT_EMAIL` before inviting external beta users. Until then, support intake is not production-ready.</p>
          </div>
        )}
        <h2>What To Include</h2>
        <p>Include your sign-in email, device/browser, whether you are signed in or using guest mode, what you expected, what happened, screenshots if helpful, and whether you want help troubleshooting or deleting data.</p>
        <p>가입 이메일, 사용 기기/브라우저, 마지막으로 완료한 단계, 예상한 결과, 실제로 발생한 문제를 함께 보내 주세요.</p>
        <h2>First-Session Checklist</h2>
        <p>If onboarding feels broken, tell us the last step you completed: account creation, profile setup, diagnostic, mini mock, daily plan, export, or data reset.</p>
        <h2>Beta Response Targets</h2>
        <p>Critical data-access or sign-in issues should be reviewed within one business day. Practice/scoring questions should be reviewed within three business days during beta.</p>
      </section>
    </main>
  );
}
