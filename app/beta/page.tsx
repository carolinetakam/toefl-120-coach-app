import Link from 'next/link';
import { betaCohortSize, betaOnboardingSteps, betaSafetyChecks } from '@/lib/launch';

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

export default function BetaPage() {
  return (
    <main className="shell stack">
      <section className="hero stack marketHero">
        <Link className="mini" href="/">Back to app</Link>
        <div className="stack" style={{ gap: 10 }}>
          <span className="kicker">Closed beta onboarding</span>
          <h1>Join the first TOEFL 120 Coach Korea beta</h1>
          <p className="copy">We are inviting 5 Korean TOEFL learners to test a 3-day emergency prep loop with a 5-day maximum proof window. It helps organize practice, find weak spots, and review mistakes. It does not predict an official TOEFL score.</p>
          <p className="copy">시작 전 베타 참여 가능 여부를 먼저 확인해 주세요. 가입, 목표 입력, 진단, 미니 모의고사, 오늘의 학습 계획 순서로 진행합니다.</p>
        </div>
        <div className="chips">
          <span className="chip">{betaCohortSize}</span>
          <span className="chip">Email sign-in</span>
          <span className="chip">Practice signals only</span>
        </div>
        <p className="copy">Before you start: confirm your beta slot with us. Use the same email for sign-in and support so we can help with sync, deletion, or scoring questions.</p>
        <div className="row" style={{ justifyContent: 'flex-start' }}>
          <Link className="cta legalAction" href="/">Start onboarding</Link>
          <Link className="secondary legalAction" href="/support">Contact support</Link>
          <Link className="secondary legalAction" href="/korea">Korea beta page</Link>
        </div>
      </section>

      <section className="panel stack legalPage">
        <h2>3-Day Proof Path</h2>
        <div className="grid two">
          {betaOnboardingSteps.map((step, index) => (
            <div className="sectionCard stack" key={step.title}>
              <span className="chip">Step {index + 1}</span>
              <h3>{step.title}</h3>
              <p className="copy">{step.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid two">
        <div className="panel stack legalPage">
          <h2>Before You Start</h2>
          {betaSafetyChecks.map((check) => <p key={check}>{check}</p>)}
          <h2>Not A Fit Yet</h2>
          <p>This beta is not for learners who need official score prediction, guaranteed improvement, human essay grading, or full Korean-language product support.</p>
        </div>
        <div className="panel stack legalPage">
          <h2>Support Promise</h2>
          <p>Critical sign-in or data-access problems are reviewed within one business day during beta. Practice and scoring questions are reviewed within three business days.</p>
          {supportEmail ? <p>Email: <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p> : <p>Support email is not configured. Do not invite beta users until readiness passes.</p>}
          <div className="row" style={{ justifyContent: 'flex-start' }}>
            <Link className="secondary legalAction" href="/privacy">Privacy</Link>
            <Link className="secondary legalAction" href="/terms">Terms</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
