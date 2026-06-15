import { canAccessMock, getMissingRequiredActions, getTodayMission } from '@/lib/progression';
import { mockTests } from '@/lib/mock-tests';
import { practiceCards } from '@/lib/seed';
import type { SprintAction } from '@/lib/sprint';
import type { AppState, Section } from '@/lib/types';
import type { Bottleneck, NextAction } from './types';

const fallbackSection: Section = 'reading';

function actionHref(action: SprintAction) {
  if (action.type === 'mock') return `/?view=path&mock=${encodeURIComponent(action.mockId)}`;
  if (action.type === 'review') return '/?view=review';
  return `/?view=library&card=${encodeURIComponent(action.cardId)}`;
}

function fromSprintAction(action: SprintAction, priority: NextAction['priority'], reason = action.reason): NextAction {
  return {
    id: priority === 'required_repair' ? `required-${action.type}-${action.label}` : `${priority}-${action.type}-${action.label}`,
    title: action.label,
    reason,
    section: action.type === 'mock' ? fallbackSection : action.section ?? fallbackSection,
    estimatedMinutes: action.type === 'mock' ? 24 : action.type === 'review' ? 8 : 12,
    expectedImpact: priority === 'required_repair' ? 2 : 1,
    href: actionHref(action),
    priority,
    source: action,
  };
}

function bottleneckAction(bottleneck: Bottleneck): NextAction | undefined {
  const card = practiceCards[bottleneck.section][0];
  if (!card) return undefined;
  const source: SprintAction = {
    type: 'practice',
    label: card.title,
    section: card.section,
    cardId: card.id,
    reason: bottleneck.recommendedFocus,
  };
  return {
    ...fromSprintAction(source, 'largest_bottleneck', `${bottleneck.title} is currently your largest score bottleneck.`),
    id: `${bottleneck.section}-largest-bottleneck`,
    expectedImpact: Math.min(4, Math.max(1, bottleneck.estimatedScoreLoss)),
  };
}

export function getNextBestAction(appState: AppState, bottlenecks: Bottleneck[]): NextAction {
  if (!appState.diagnosticCompleted) {
    return {
      id: 'complete-diagnostic',
      title: 'Complete strategy diagnostic',
      reason: 'A diagnostic baseline is needed before the app can predict your score or rank bottlenecks.',
      section: fallbackSection,
      estimatedMinutes: 8,
      expectedImpact: 1,
      href: '/?view=today&task=diagnostic',
      priority: 'diagnostic',
      source: { type: 'diagnostic' },
    };
  }

  const required = getMissingRequiredActions(appState)[0];
  if (required) {
    return fromSprintAction(required.action, 'required_repair', `This required repair is blocking progress: ${required.reason}`);
  }

  const topBottleneck = bottlenecks[0];
  const topBottleneckAction = topBottleneck ? bottleneckAction(topBottleneck) : undefined;
  if (topBottleneckAction) return topBottleneckAction;

  const mission = getTodayMission(appState);
  if (mission.action) return fromSprintAction(mission.action, 'current_path', mission.why);

  const mockAccess = canAccessMock(appState);
  const hasSubmittedMock = appState.miniMockAttempts.some((attempt) => attempt.submitted);
  const nextMock = mockTests.find((mock) => !appState.miniMockAttempts.some((attempt) => attempt.mockId === mock.id && attempt.submitted));
  if (mockAccess.allowed && !hasSubmittedMock && nextMock) {
    return {
      id: `mini-mock-${nextMock.id}`,
      title: 'Run mini mock proof',
      reason: 'Mini mock proof is unlocked, so the next best evidence is a timed mixed-section attempt.',
      section: fallbackSection,
      estimatedMinutes: 24,
      expectedImpact: 2,
      href: `/?view=path&mock=${encodeURIComponent(nextMock.id)}`,
      priority: 'mini_mock',
      source: {
        type: 'mock',
        label: 'Run mini mock proof',
        mockId: nextMock.id,
        reason: 'Mini mock proof is unlocked, so the next best evidence is a timed mixed-section attempt.',
      },
    };
  }

  return {
    id: 'continue-today-path',
    title: mission.title,
    reason: mission.coachNote,
    section: fallbackSection,
    estimatedMinutes: mission.minutes,
    expectedImpact: 1,
    href: '/?view=today',
    priority: 'current_path',
  };
}
