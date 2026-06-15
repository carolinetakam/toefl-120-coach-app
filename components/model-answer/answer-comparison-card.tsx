import { ModelAnswer } from '@/lib/types';

type AnswerComparisonCardProps = {
  learnerAnswer: string;
  modelAnswer?: ModelAnswer;
  checklist: string[];
  checkedItems: Record<string, boolean>;
  onToggle: (item: string, checked: boolean) => void;
};

export function AnswerComparisonCard({ learnerAnswer, modelAnswer, checklist, checkedItems, onToggle }: AnswerComparisonCardProps) {
  return (
    <div className="answerComparisonCard stack">
      <div className="row">
        <h3>Compare Yourself</h3>
        <span className="chip">{checklist.filter((item) => checkedItems[item]).length}/{checklist.length}</span>
      </div>
      <div className="grid two">
        <div className="stack">
          <span className="mini">Your Answer</span>
          <p className="comparisonText">{learnerAnswer.trim() || 'No written reflection saved for this task.'}</p>
        </div>
        <div className="stack">
          <span className="mini">Sample Answer</span>
          <p className="comparisonText">{modelAnswer?.response ?? 'Model answer coming soon.'}</p>
        </div>
      </div>
      <div className="stack">
        <span className="mini">Comparison checklist</span>
        {checklist.map((item) => (
          <label key={item} className="row comparisonCheck">
            <input
              type="checkbox"
              checked={Boolean(checkedItems[item])}
              onChange={(event) => onToggle(item, event.target.checked)}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
