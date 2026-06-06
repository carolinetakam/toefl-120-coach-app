import Link from 'next/link';
import { koreaBetaQualification } from '@/lib/launch';

export default function KoreaPage() {
  return (
    <main className="shell stack">
      <section className="hero stack marketHero">
        <div className="stack" style={{ gap: 10 }}>
          <span className="kicker">Korea closed beta</span>
          <h1>매일 무엇을 공부해야 할지 헷갈리는 TOEFL 학습자를 위한 비공개 베타</h1>
          <p className="copy">TOEFL 120 Coach는 진단, 미니 모의고사, 데일리 플랜, 복습 루프를 통해 약점을 다시 보게 해주는 연습 도구입니다. 공식 TOEFL 점수 예측 서비스가 아닙니다.</p>
          <p className="copy">A private practice coach for students preparing for exchange programs, international schools, graduate school, and study abroad applications.</p>
        </div>
        <div className="chips">
          <span className="chip">English-first beta</span>
          <span className="chip">Korean support copy</span>
          <span className="chip">Practice signals, not official scores</span>
        </div>
        <div className="row" style={{ justifyContent: 'flex-start' }}>
          <Link className="cta legalAction" href="/">베타 참여하기</Link>
          <Link className="secondary legalAction" href="/beta">베타 진행 방식 보기</Link>
        </div>
      </section>

      <section className="grid two">
        <div className="panel stack">
          <h2>한국 베타 대상</h2>
          <p>TOEFL을 준비하지만 매일 무엇을 연습해야 할지 불분명한 학습자에게 맞춥니다. 특히 말하기와 쓰기에서 “공부는 하는데 점수가 오르는지 모르겠다”는 문제를 해결하는 데 집중합니다.</p>
        </div>
        <div className="panel stack">
          <h2>What The Beta Measures</h2>
          <p>We track whether learners complete the diagnostic, finish a mini mock, understand the feedback, return for urgent daily practice, and improve objective accuracy plus writing/speaking structure within 3-5 days.</p>
        </div>
      </section>

      <section className="panel stack legalPage">
        <h2>Who Should Apply First</h2>
        <div className="grid two">
          {koreaBetaQualification.map((item) => (
            <div className="sectionCard" key={item}>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <h2>3-Day Emergency Study Loop</h2>
        <div className="grid two">
          <div className="sectionCard stack">
            <span className="chip">Day 1</span>
            <h3>Diagnostic + mini mock</h3>
            <p className="copy">Find the first blocker and record a practice-signal baseline.</p>
          </div>
          <div className="sectionCard stack">
            <span className="chip">Day 2</span>
            <h3>Daily plan + review</h3>
            <p className="copy">Practice the weakest section and repeat missed material.</p>
          </div>
          <div className="sectionCard stack">
            <span className="chip">Day 3</span>
            <h3>Proof mini mock + repair</h3>
            <p className="copy">Compare objective accuracy, writing structure, speaking evidence, and the exact final repair.</p>
          </div>
          <div className="sectionCard stack">
            <span className="chip">Support</span>
            <h3>Founder-led feedback</h3>
            <p className="copy">Every beta issue is reviewed before adding the next cohort.</p>
          </div>
        </div>
      </section>

      <section className="panel stack legalPage">
        <h2>Safe Korean Positioning</h2>
        <p>“TOEFL 공식 점수”를 약속하지 않습니다. 이 제품은 매일 연습할 내용을 정리하고, 약점을 다시 보게 하고, 연습 신호를 보여주는 독립 학습 도구입니다.</p>
        <p>TOEFL 120 Coach는 ETS와 제휴, 후원, 인증 관계가 없습니다. 앱 안의 점수와 readiness는 학습 참고용 연습 신호입니다.</p>
      </section>
    </main>
  );
}
