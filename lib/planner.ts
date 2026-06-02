import { daysUntil } from '@/lib/dates';
import { practiceCards } from '@/lib/seed';
import { AppState, DailyTask, Section } from '@/lib/types';

export function weakestSubskillForSection(state: AppState, section: Section) {
  const cards = practiceCards[section];
  const ranked = cards
    .map((card) => ({
      subskill: card.subskill,
      score: state.subskillScores[card.subskill] ?? state.sectionScores[section],
    }))
    .sort((a, b) => a.score - b.score);

  return ranked[0]?.subskill ?? 'core skill';
}

export function generateDailyPlan(state: AppState): DailyTask[] {
  const sections = Object.entries(state.sectionScores)
    .sort((a, b) => a[1] - b[1])
    .map(([section]) => section as Section);
  const weakest = sections[0] ?? 'speaking';
  const secondWeakest = sections[1] ?? 'writing';
  const available = state.profile.dailyMinutes;
  const urgency = daysUntil(state.profile.testDate);
  const weakestSubskill = weakestSubskillForSection(state, weakest);
  const secondWeakestSubskill = weakestSubskillForSection(state, secondWeakest);
  const dueReviewCount = state.reviewQueue.filter((item) => new Date(item.dueDate) <= new Date()).length;
  const reviewMinutes = dueReviewCount > 0 && available >= 35 ? 10 : 5;
  const retrievalMinutes = Math.max(5, Math.round(available * 0.18));
  const timedMinutes = Math.max(5, urgency < 21 ? Math.round(available * 0.28) : Math.round(available * 0.23));
  const precisionMinutes = Math.max(5, available - retrievalMinutes - timedMinutes - reviewMinutes);

  return [
    {
      id: 'task-retrieval',
      block: 'Retrieval',
      title: `Recover core patterns in ${weakest} (${weakestSubskill})`,
      reason: dueReviewCount > 0
        ? 'You have due review items and need quick memory strengthening before new work.'
        : 'Start with a short retrieval pass so new work sticks better.',
      minutes: retrievalMinutes,
      section: weakest,
    },
    {
      id: 'task-precision',
      block: 'Precision',
      title: `${weakest} deliberate drill: ${weakestSubskill}`,
      reason: `This section is currently your biggest blocker to ${state.profile.targetScore}.`,
      minutes: precisionMinutes,
      section: weakest,
    },
    {
      id: 'task-timed',
      block: 'Timed',
      title: `${secondWeakest} timed set: ${secondWeakestSubskill}`,
      reason: urgency < 21 ? 'Test date is close, so time pressure needs to rise.' : 'Build independent performance under light pressure.',
      minutes: timedMinutes,
      section: secondWeakest,
    },
    {
      id: 'task-review',
      block: 'Review',
      title: 'Error log correction pass',
      reason: 'Repeated mistakes only shrink if you revisit them explicitly.',
      minutes: reviewMinutes,
      section: weakest,
    },
  ];
}

export function summarizeDailyPlanTask(task: DailyTask) {
  return `${task.block}: ${task.title} for ${task.minutes} minutes. ${task.reason}`;
}

export function summarizeDailyPlan(tasks: DailyTask[]) {
  return tasks.map(summarizeDailyPlanTask);
}
