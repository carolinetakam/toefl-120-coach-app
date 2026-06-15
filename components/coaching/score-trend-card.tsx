import type { TrendPoint } from '@/lib/coaching';

export function ScoreTrendCard({ trend }: { trend: TrendPoint[] }) {
  if (trend.length < 2) {
    return (
      <div className="sectionCard stack coachingCard">
        <div className="row">
          <span className="chip">Score Trend</span>
          <span className="pill-warn">Not enough history yet</span>
        </div>
        <h3>No movement line yet</h3>
        <p className="copy">Save at least two dated practice or mini mock results before showing improvement.</p>
      </div>
    );
  }

  const first = trend[0];
  const last = trend[trend.length - 1];
  const delta = last.predictedScore - first.predictedScore;
  const min = Math.min(...trend.map((point) => point.predictedScore));
  const max = Math.max(...trend.map((point) => point.predictedScore));
  const span = Math.max(1, max - min);

  return (
    <div className="sectionCard stack coachingCard">
      <div className="row">
        <span className="chip">Score Trend</span>
        <span className={delta >= 0 ? 'pill-good' : 'pill-warn'}>{delta >= 0 ? '+' : ''}{delta} pts</span>
      </div>
      <div className="coachingTrendTrack" aria-label="Predicted score trend">
        {trend.map((point) => (
          <span
            className="coachingTrendPoint"
            key={point.date}
            title={`${point.date}: ${point.predictedScore}`}
            style={{ height: `${34 + ((point.predictedScore - min) / span) * 46}px` }}
          />
        ))}
      </div>
      <div className="row">
        <span className="mini">{first.date}: {first.predictedScore}</span>
        <span className="mini">{last.date}: {last.predictedScore}</span>
      </div>
    </div>
  );
}
