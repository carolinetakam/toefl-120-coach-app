import { getDiagnosticQuestions } from '@/lib/diagnostic';
import type { AppState, Section } from '@/lib/types';
import type { Bottleneck } from './types';
import { clamp, sectionAverage, sectionLabels, sections, severityToScoreLoss } from './utils';

const sectionFocus: Record<Section, { title: string; focus: string }> = {
  reading: { title: 'Reading precision', focus: 'Use evidence location and trap rejection before adding more passages.' },
  listening: { title: 'Listening capture', focus: 'Tighten notes around purpose, examples, contrast, and speaker attitude.' },
  speaking: { title: 'Speaking fluency', focus: 'Use one clear structure, finish cleanly, and record a timed answer.' },
  writing: { title: 'Writing control', focus: 'Make the claim-support-example relationship obvious before polishing language.' },
};

function diagnosticMisses(state: AppState, section: Section) {
  if (!state.diagnosticCompleted) return 0;
  return getDiagnosticQuestions(state.diagnosticFormId).filter((question) => (
    question.section === section && state.diagnosticAnswers[question.id] !== question.answer
  )).length;
}

function incompleteSignals(state: AppState, section: Section) {
  let count = 0;
  if (section === 'speaking') {
    count += state.speakingAttempts.filter((attempt) => attempt.selfRating <= 2 || !attempt.hasAudioEvidence).length;
  }
  if (section === 'writing') {
    count += state.writingDrafts.filter((draft) => draft.score < 0.6 || !draft.revision.trim()).length;
  }
  count += state.miniMockAttempts.filter((attempt) => !attempt.submitted && (attempt.updatedAt || Object.keys(attempt.answers).length > 0)).length;
  return count;
}

export function detectBottlenecks(appState: AppState): Bottleneck[] {
  if (!appState.diagnosticCompleted && appState.practiceHistory.length === 0 && appState.errorLog.length === 0 && appState.reviewQueue.length === 0) {
    return [];
  }

  return sections
    .map((section) => {
      const repairCount = appState.errorLog.filter((entry) => entry.section === section && !entry.corrected).length
        + appState.reviewQueue.filter((entry) => entry.section === section).length;
      const failedAttemptCount = appState.practiceHistory.filter((entry) => entry.section === section && entry.score < 0.7).length;
      const lowDiagnosticSignal = diagnosticMisses(appState, section) + (appState.diagnosticCompleted && appState.sectionScores[section] < 0.65 ? 1 : 0);
      const incompleteSubmissionCount = incompleteSignals(appState, section);
      const rawSeverity = repairCount * 3 + failedAttemptCount * 2 + lowDiagnosticSignal * 2 + incompleteSubmissionCount;
      const hasSectionPractice = appState.practiceHistory.some((entry) => entry.section === section);
      const weakScoreSeverity = appState.diagnosticCompleted || hasSectionPractice
        ? Math.max(0, Math.round((0.75 - sectionAverage(appState, section)) * 6))
        : 0;
      const severity = clamp(Math.max(rawSeverity, weakScoreSeverity), 0, 10);
      const evidenceCount = repairCount + failedAttemptCount + lowDiagnosticSignal + incompleteSubmissionCount;
      const focus = sectionFocus[section];

      return {
        id: `${section}-bottleneck`,
        section,
        title: focus.title,
        description: `${sectionLabels[section]} is currently the clearest score limiter based on ${evidenceCount || 'limited'} saved signal${evidenceCount === 1 ? '' : 's'}.`,
        severity,
        evidenceCount,
        estimatedScoreLoss: severityToScoreLoss(severity || 1),
        recommendedFocus: focus.focus,
      };
    })
    .filter((item) => item.severity > 0 || item.evidenceCount > 0)
    .sort((a, b) => b.severity - a.severity || b.evidenceCount - a.evidenceCount || a.section.localeCompare(b.section))
    .slice(0, 3);
}
