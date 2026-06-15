import type { WeeklyCoachingReport } from '@/lib/coaching';
import { sectionLabels } from '@/lib/seed';

export function WeeklyReportCard({ report }: { report: WeeklyCoachingReport }) {
  return (
    <div className="sectionCard stack coachingCard">
      <div className="row">
        <span className="chip">Weekly Report</span>
        <span className={report.improvement >= 0 ? 'pill-good' : 'pill-warn'}>
          {report.improvement >= 0 ? '+' : ''}{report.improvement} pts
        </span>
      </div>
      <h3>{report.weekStart} - {report.weekEnd}</h3>
      <p className="copy">{report.startingPredictedScore} to {report.endingPredictedScore}. Focus: {report.recommendedFocus}</p>
      <div className="chips">
        <span className="pill-good">Strongest {sectionLabels[report.strongestSection]}</span>
        <span className="pill-warn">Weakest {sectionLabels[report.weakestSection]}</span>
      </div>
    </div>
  );
}
