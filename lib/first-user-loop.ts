import { AppState } from '@/lib/types';

export type FirstUserLoopStatus = 'Complete' | 'Current' | 'Next';

export interface FirstUserLoopStep {
  label: 'Profile' | 'Diagnostic' | 'Review' | 'Next drill' | 'Saved progress';
  status: FirstUserLoopStatus;
}

export interface PersonalProofGate {
  ready: boolean;
  label: string;
  detail: string;
  missing: string[];
}

function workflowStatus(complete: boolean, current: boolean): FirstUserLoopStatus {
  if (complete) return 'Complete';
  if (current) return 'Current';
  return 'Next';
}

export function hasUserProgress(state: AppState) {
  return (
    state.onboarded ||
    state.diagnosticCompleted ||
    state.xp > 0 ||
    state.practiceHistory.length > 0 ||
    state.writingDrafts.length > 0 ||
    state.speakingAttempts.length > 0 ||
    state.miniMockAttempts.length > 0
  );
}

export function getFirstUserLoopSteps(state: AppState): FirstUserLoopStep[] {
  return [
    { label: 'Profile', status: workflowStatus(state.onboarded, !state.onboarded) },
    { label: 'Diagnostic', status: workflowStatus(state.diagnosticCompleted, state.onboarded && !state.diagnosticCompleted) },
    { label: 'Review', status: workflowStatus(state.reviewQueue.length > 0, state.diagnosticCompleted && state.reviewQueue.length === 0) },
    { label: 'Next drill', status: workflowStatus(state.practiceHistory.length > 0, state.diagnosticCompleted && state.practiceHistory.length === 0) },
    { label: 'Saved progress', status: workflowStatus(hasUserProgress(state), state.diagnosticCompleted) },
  ];
}

export function buildPersonalProofGate(state: AppState): PersonalProofGate {
  const steps = getFirstUserLoopSteps(state);
  const missing: string[] = steps.filter((step) => step.status !== 'Complete').map((step) => step.label);
  const hasProofSet = state.practiceHistory.some((entry) => entry.subskill === 'mini mock') || state.miniMockAttempts.some((attempt) => attempt.submitted);
  if (!hasProofSet) missing.push('Mini mock proof');

  const uniqueMissing = [...new Set(missing)];
  const ready = uniqueMissing.length === 0;

  return {
    ready,
    label: ready ? 'Personal test-week proof is ready' : 'Personal proof still needs work',
    detail: ready
      ? 'The local app has the first-user loop, saved progress, and mini mock proof needed for your own test-week use.'
      : `Finish: ${uniqueMissing.join(', ')}.`,
    missing: uniqueMissing,
  };
}
