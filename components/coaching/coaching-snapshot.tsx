import type { CoachingProfile } from '@/lib/coaching';
import { sectionLabels } from '@/lib/seed';

function confidenceLabel(confidence: CoachingProfile['confidence']) {
  if (confidence === 'high') return 'High confidence';
  if (confidence === 'medium') return 'Medium confidence';
  return 'Low confidence';
}

export function CoachingSnapshot({ profile }: { profile: CoachingProfile }) {
  const scoreText = profile.predictionAvailable ? profile.predictedScore : 'Set target';
  const gapText = profile.scoreGap === undefined || !profile.predictionAvailable ? 'Needs baseline' : `${profile.scoreGap} pts`;

  return (
    <div className="panel stack coachingSnapshot">
      <div className="row">
        <div>
          <span className="kicker">Coaching Intelligence</span>
          <h2>Predicted Score</h2>
          <p className="copy">Directional coaching signal from saved diagnostic, practice, and mini mock evidence.</p>
        </div>
        <span className={profile.predictionAvailable ? 'pill-good' : 'pill-warn'}>{confidenceLabel(profile.confidence)}</span>
      </div>

      <div className="grid four">
        <div className="stat">
          <span className="mini">Predicted Score</span>
          <strong>{scoreText}</strong>
        </div>
        <div className="stat">
          <span className="mini">Target</span>
          <strong>{profile.targetScore ?? 'Set'}</strong>
        </div>
        <div className="stat">
          <span className="mini">Score Gap</span>
          <strong>{gapText}</strong>
        </div>
        <div className="stat">
          <span className="mini">Source</span>
          <strong>{profile.predictionSource.replaceAll('_', ' ')}</strong>
        </div>
      </div>

      <div className="grid two">
        <div className="sectionCard stack">
          <div className="row">
            <span className="pill-good">Strongest</span>
            <span className="mini">{profile.sectionScores[profile.strongestSection]}/30</span>
          </div>
          <h3>{sectionLabels[profile.strongestSection]}</h3>
          <div className="progressBar"><span style={{ width: `${Math.max(4, (profile.sectionScores[profile.strongestSection] / 30) * 100)}%` }} /></div>
        </div>
        <div className="sectionCard stack">
          <div className="row">
            <span className="pill-warn">Weakest</span>
            <span className="mini">{profile.sectionScores[profile.weakestSection]}/30</span>
          </div>
          <h3>{sectionLabels[profile.weakestSection]}</h3>
          <div className="progressBar"><span style={{ width: `${Math.max(4, (profile.sectionScores[profile.weakestSection] / 30) * 100)}%` }} /></div>
        </div>
      </div>
    </div>
  );
}
