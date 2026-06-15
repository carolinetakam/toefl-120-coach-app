import type { Bottleneck } from '@/lib/coaching';
import { sectionLabels } from '@/lib/seed';

export function BottleneckCard({ bottleneck }: { bottleneck?: Bottleneck }) {
  if (!bottleneck) {
    return (
      <div className="sectionCard stack coachingCard">
        <div className="row">
          <span className="chip">Biggest Bottleneck</span>
          <span className="pill-warn">Needs evidence</span>
        </div>
        <h3>No bottleneck ranked yet</h3>
        <p className="copy">Complete the diagnostic or save one real practice result before the app ranks a score limiter.</p>
      </div>
    );
  }

  return (
    <div className="sectionCard stack coachingCard">
      <div className="row">
        <span className="chip">Biggest Bottleneck</span>
        <span className="pill-warn">-{bottleneck.estimatedScoreLoss} pts</span>
      </div>
      <h3>{bottleneck.title}</h3>
      <p className="copy">{bottleneck.description}</p>
      <div className="chips">
        <span className="chip">{sectionLabels[bottleneck.section]}</span>
        <span className="chip">Severity {bottleneck.severity}/10</span>
        <span className="chip">{bottleneck.evidenceCount} signals</span>
      </div>
      <p className="mini">{bottleneck.recommendedFocus}</p>
    </div>
  );
}
