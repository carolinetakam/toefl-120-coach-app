import { generateSprintPlan, getTodaySprintDay, SprintAction } from '@/lib/sprint';
import { AppState, Section } from '@/lib/types';

export type UnlockStatus = 'completed' | 'current' | 'locked' | 'available_optional';

export interface PathDayView {
  day: number;
  title: string;
  minutes: number;
  sectionFocus: Section[];
  outcome: string;
  tasks: string[];
  actions: SprintAction[];
  status: UnlockStatus;
  unlockReason: string;
}

export interface AccessGate {
  allowed: boolean;
  status: UnlockStatus;
  reason: string;
}

export interface TodayMission {
  day: number;
  title: string;
  focusLabel: string;
  minutes: number;
  why: string;
  primaryActionLabel: string;
  checklist: Array<{ label: string; done: boolean }>;
  tomorrow?: PathDayView;
  coachNote: string;
  action?: SprintAction;
}

function completedMiniMocks(state: AppState) {
  return state.miniMockAttempts.filter((attempt) => attempt.submitted).length;
}

function hasPracticeCardEvidence(state: AppState, cardId: string) {
  return state.practiceHistory.some((entry) => entry.id === cardId || entry.id.startsWith(`${cardId}-`));
}

function hasMockEvidence(state: AppState, mockId: string) {
  return state.miniMockAttempts.some((attempt) => attempt.mockId === mockId && attempt.submitted);
}

function hasActionEvidence(state: AppState, action: SprintAction | undefined) {
  if (!action) return false;
  if (action.type === 'practice') return hasPracticeCardEvidence(state, action.cardId);
  if (action.type === 'mock') return hasMockEvidence(state, action.mockId);
  if (action.type === 'review') return state.reviewQueue.length > 0 || state.errorLog.length > 0;
  return false;
}

function completedDayCount(state: AppState) {
  if (!state.diagnosticCompleted) return 0;
  const plan = generateSprintPlan(state);
  let completed = 0;
  for (const day of plan) {
    if (!hasActionEvidence(state, day.actions[0])) break;
    completed += 1;
  }
  return completed;
}

const optionalSprintReason = 'Available as optional sprint work because your test date is close.';

function optionalSprintCutoffDay(state: AppState) {
  if (!state.diagnosticCompleted) return 0;
  return getTodaySprintDay(state).day;
}

export function canAccessMock(state: AppState): AccessGate {
  if (!state.diagnosticCompleted) {
    return { allowed: false, status: 'locked', reason: 'Finish the strategy diagnostic before using mini mock proof.' };
  }
  if (state.practiceHistory.length < 1) {
    return { allowed: false, status: 'locked', reason: 'Complete one repair drill before using mini mock proof.' };
  }
  if (state.reviewQueue.length < 1 && state.errorLog.length < 1) {
    return { allowed: false, status: 'locked', reason: 'Create one review or repair item before using mini mock proof.' };
  }
  return { allowed: true, status: 'current', reason: 'Mini mock proof is unlocked.' };
}

export function canAccessFullLibrary(state: AppState): AccessGate {
  if (state.diagnosticCompleted) {
    return { allowed: true, status: 'current', reason: 'Diagnostic proof exists, so the full library is available.' };
  }
  return { allowed: false, status: 'locked', reason: 'Finish the diagnostic first so practice is ordered by your weakest area.' };
}

export function buildPathDayViews(state: AppState): PathDayView[] {
  const plan = generateSprintPlan(state);
  const doneDays = completedDayCount(state);
  const optionalCutoffDay = optionalSprintCutoffDay(state);

  return plan.map((day, index) => {
    let status: UnlockStatus;
    let unlockReason: string;

    if (!state.diagnosticCompleted) {
      status = index === 0 ? 'current' : 'locked';
      unlockReason = index === 0 ? 'Finish the strategy diagnostic to open your first repair day.' : 'Locked until the diagnostic is complete.';
    } else if (index < doneDays) {
      status = 'completed';
      unlockReason = 'Completed from saved practice or mock evidence.';
    } else if (index === doneDays) {
      status = 'current';
      unlockReason = 'This is your next best day.';
    } else if (day.day <= optionalCutoffDay) {
      status = 'available_optional';
      unlockReason = optionalSprintReason;
    } else {
      status = 'locked';
      unlockReason = 'Locked until today’s mission is complete';
    }

    return { ...day, status, unlockReason };
  });
}

export function getNextLockedReason(state: AppState, day: number) {
  const pathDay = buildPathDayViews(state).find((item) => item.day === day);
  if (!pathDay) {
    throw new Error(`No progression day ${day} exists.`);
  }
  return pathDay.unlockReason;
}

export function getTodayMission(state: AppState): TodayMission {
  const days = buildPathDayViews(state);
  const current = days.find((day) => day.status === 'current');
  if (!current) {
    throw new Error('Progression path has no current mission.');
  }
  const tomorrow = days.find((day) => day.day === current.day + 1);
  const action = current.actions[0];
  const focusLabel = current.sectionFocus.map((section) => section[0].toUpperCase() + section.slice(1)).join(' + ');

  const checklist = !state.diagnosticCompleted
    ? [{ label: 'Finish strategy diagnostic', done: false }]
    : [
        { label: 'Diagnostic baseline saved', done: state.diagnosticCompleted },
        { label: 'Complete today’s primary drill', done: hasActionEvidence(state, current.actions[0]) },
        { label: 'Save one review or repair signal', done: state.reviewQueue.length > 0 || state.errorLog.length > 0 || completedMiniMocks(state) > 0 },
      ];

  return {
    day: current.day,
    title: current.title,
    focusLabel,
    minutes: current.minutes,
    why: current.outcome,
    primaryActionLabel: state.diagnosticCompleted ? `Start: ${action?.label ?? current.title}` : 'Continue diagnostic',
    checklist,
    tomorrow,
    coachNote: state.diagnosticCompleted
      ? 'Do the current mission first. Extra content stays secondary until the next proof point is saved.'
      : 'The diagnostic keeps the plan honest before practice opens up.',
    action,
  };
}
