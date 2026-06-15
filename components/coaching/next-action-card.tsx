import type { NextAction } from '@/lib/coaching';
import { sectionLabels } from '@/lib/seed';

export function NextActionCard({ action, onStart }: { action: NextAction; onStart: () => void }) {
  return (
    <div className="sectionCard stack coachingCard">
      <div className="row">
        <span className="pill-good">Best Next Action</span>
        <span className="mini">{action.estimatedMinutes} min</span>
      </div>
      <h3>{action.title}</h3>
      <p className="copy">{action.reason}</p>
      <div className="chips">
        <span className="chip">{sectionLabels[action.section]}</span>
        <span className="chip">Impact +{action.expectedImpact}</span>
        <span className="chip">{action.priority.replaceAll('_', ' ')}</span>
      </div>
      <button className="cta" onClick={onStart}>Start</button>
    </div>
  );
}
