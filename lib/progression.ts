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
  missingRequiredActions: MissingRequiredAction[];
}

export interface MissingRequiredAction {
  day: number;
  label: string;
  reason: string;
  action: SprintAction;
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

function missingRequiredActionsForDay(state: AppState, day: { day: number; actions: SprintAction[] }) {
  return day.actions
    .filter((action) => !hasActionEvidence(state, action))
    .map((action) => ({
      day: day.day,
      label: action.label,
      reason: action.reason,
      action,
    }));
}

function hasDayEvidence(state: AppState, day: { actions: SprintAction[] }) {
  return day.actions.length > 0 && day.actions.every((action) => hasActionEvidence(state, action));
}

function completedDayCount(state: AppState) {
  if (!state.diagnosticCompleted) return 0;
  const plan = generateSprintPlan(state);
  let completed = 0;
  for (const day of plan) {
    if (!hasDayEvidence(state, day)) break;
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
  const firstRequiredDay = generateSprintPlan(state)[0];
  const missingRequired = firstRequiredDay ? missingRequiredActionsForDay(state, firstRequiredDay) : [];
  if (missingRequired.length > 0) {
    return {
      allowed: false,
      status: 'locked',
      reason: `Complete ${missingRequired.length} required ${missingRequired.length === 1 ? 'repair exercise' : 'repair exercises'} before using mini mock proof: ${missingRequired.map((item) => item.label).join(', ')}.`,
    };
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
  const blockingDay = state.diagnosticCompleted ? plan.find((day) => !hasDayEvidence(state, day)) : undefined;
  const blockingMissingActions = blockingDay ? missingRequiredActionsForDay(state, blockingDay) : [];

  return plan.map((day, index) => {
    let status: UnlockStatus;
    let unlockReason: string;

    if (!state.diagnosticCompleted) {
      status = index === 0 ? 'current' : 'locked';
      unlockReason = index === 0 ? 'Finish the strategy diagnostic to open your first repair day.' : 'Locked until the diagnostic is complete.';
    } else if (index < doneDays) {
      status = 'completed';
      unlockReason = 'Completed from submitted practice or mock evidence.';
    } else if (index === doneDays) {
      status = 'current';
      unlockReason = 'This is your next best day.';
    } else if (day.day <= optionalCutoffDay) {
      status = 'available_optional';
      unlockReason = optionalSprintReason;
    } else {
      status = 'locked';
      unlockReason = blockingDay && blockingMissingActions.length > 0
        ? `Day ${day.day} is locked because ${blockingMissingActions.length} required ${blockingMissingActions.length === 1 ? 'repair exercise is' : 'repair exercises are'} incomplete from Day ${blockingDay.day}.`
        : 'Locked until today’s mission is complete.';
    }

    return { ...day, status, unlockReason, missingRequiredActions: status === 'locked' ? blockingMissingActions : missingRequiredActionsForDay(state, day) };
  });
}

export function getMissingRequiredActions(state: AppState) {
  if (!state.diagnosticCompleted) return [];
  const current = buildPathDayViews(state).find((day) => day.status === 'current');
  return current?.missingRequiredActions ?? [];
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
  const current = days.find((day) => day.status === 'current') ?? days.at(-1);
  if (!current) {
    return {
      day: 1,
      title: 'Start TOEFL path',
      focusLabel: 'Diagnostic',
      minutes: state.profile.dailyMinutes,
      why: 'Set your profile and finish the diagnostic to open the first mission.',
      primaryActionLabel: 'Continue diagnostic',
      checklist: [{ label: 'Finish strategy diagnostic', done: false }],
      coachNote: 'The diagnostic keeps the plan honest before practice opens up.',
    };
  }
  const tomorrow = days.find((day) => day.day === current.day + 1);
  const action = current.actions[0];
  const focusLabel = current.sectionFocus.map((section) => section[0].toUpperCase() + section.slice(1)).join(' + ');
  const pathComplete = state.diagnosticCompleted && days.length > 0 && days.every((day) => day.status === 'completed');

  const checklist = !state.diagnosticCompleted
    ? [{ label: 'Finish strategy diagnostic', done: false }]
    : pathComplete
      ? [
          { label: 'Diagnostic baseline saved', done: true },
          { label: 'All required path missions submitted', done: true },
          { label: 'Keep one review or repair signal visible', done: state.reviewQueue.length > 0 || state.errorLog.length > 0 || completedMiniMocks(state) > 0 },
        ]
    : [
        { label: 'Diagnostic baseline saved', done: state.diagnosticCompleted },
        ...current.actions.map((action) => ({ label: `Submit: ${action.label}`, done: hasActionEvidence(state, action) })),
        { label: 'Keep one review or repair signal visible', done: state.reviewQueue.length > 0 || state.errorLog.length > 0 || completedMiniMocks(state) > 0 },
      ];

  return {
    day: current.day,
    title: pathComplete ? 'Path complete: final review' : current.title,
    focusLabel,
    minutes: current.minutes,
    why: current.outcome,
    primaryActionLabel: pathComplete ? 'Review saved misses' : state.diagnosticCompleted ? `Start: ${action?.label ?? current.title}` : 'Continue diagnostic',
    checklist,
    tomorrow,
    coachNote: pathComplete
      ? 'All current path missions are complete. Keep review light, export a backup, and avoid heavy new work unless a fresh miss appears.'
      : state.diagnosticCompleted
      ? 'Do the current mission first. Extra content stays secondary until the next proof point is saved.'
      : 'The diagnostic keeps the plan honest before practice opens up.',
    action: pathComplete ? undefined : action,
  };
}
