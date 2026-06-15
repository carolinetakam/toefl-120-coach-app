import { ModelAnswer } from '@/lib/types';

type ModelAnswerCardProps = {
  modelAnswer?: ModelAnswer;
};

export function ModelAnswerCard({ modelAnswer }: ModelAnswerCardProps) {
  if (!modelAnswer) {
    return (
      <div className="modelAnswerCard stack">
        <div className="row">
          <h3>Model Answer</h3>
          <span className="pill-warn">Content gap</span>
        </div>
        <p className="copy">Model answer coming soon.</p>
      </div>
    );
  }

  return (
    <div className="modelAnswerCard stack">
      <div className="row">
        <h3>Model Answer</h3>
        <span className="pill-good">{modelAnswer.scoreBand}</span>
      </div>
      <p>{modelAnswer.response}</p>
      <div className="grid two">
        <div className="stack">
          <span className="mini">Why it is strong</span>
          {modelAnswer.strengths.map((strength) => (
            <p className="copy" key={strength}>- {strength}</p>
          ))}
        </div>
        <div className="stack">
          <span className="mini">Structure used</span>
          {modelAnswer.structure.map((step, index) => (
            <p className="copy" key={`${step}-${index}`}>{index + 1}. {step}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
