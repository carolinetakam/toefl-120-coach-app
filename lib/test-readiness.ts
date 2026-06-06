import { daysUntil } from '@/lib/dates';
import { buildPersonalProofGate } from '@/lib/first-user-loop';
import { mockTests } from '@/lib/mock-tests';
import { getSprintNextAction } from '@/lib/repair-path';
import { evaluateSpeakingAttempt, evaluateWritingAttempt, SkillEvaluation } from '@/lib/scoring';
import { practiceCards } from '@/lib/seed';
import { getSprintReadinessGates, sectionPlaybooks } from '@/lib/sprint';
import { AppState, MiniMockAttempt, PracticeCard } from '@/lib/types';

export type TestReadinessVerdict = 'ready-to-sit' | 'needs-proof' | 'blocked';

export interface TestReadinessSignal {
  label: string;
  status: 'pass' | 'missing' | 'risk';
  evidence: string;
}

export interface TestReadinessReport {
  verdict: TestReadinessVerdict;
  headline: string;
  summary: string;
  daysLeft: number;
  evidenceScore: number;
  signals: TestReadinessSignal[];
  finalChecklist: string[];
  nextActionLabel: string;
  nextActionReason: string;
}

export interface TestDayPlanBlock {
  title: string;
  minutes: number;
  mode: 'proof' | 'repair' | 'template' | 'rest';
  instruction: string;
}

export interface TestDayPlan {
  title: string;
  summary: string;
  blocks: TestDayPlanBlock[];
  avoid: string[];
}

export interface TestWeekCommand {
  status: 'needs-proof' | 'proof' | 'repair' | 'final-review';
  label: string;
  primaryAction: string;
  reason: string;
  stopRule: string;
}

function latestSubmittedMock(attempts: MiniMockAttempt[]) {
  return attempts
    .filter((attempt) => attempt.submitted)
    .slice()
    .sort((a, b) => new Date(b.submittedAt ?? b.updatedAt).getTime() - new Date(a.submittedAt ?? a.updatedAt).getTime())[0];
}

function objectiveAccuracy(attempt: MiniMockAttempt | undefined) {
  if (!attempt) return null;
  const mock = mockTests.find((item) => item.id === attempt.mockId);
  if (!mock) return null;
  const correct = mock.questions.filter((question) => attempt.answers[question.id] === question.answer).length;
  return {
    correct,
    total: mock.questions.length,
    ratio: mock.questions.length ? correct / mock.questions.length : 0,
  };
}

function signal(label: string, ok: boolean, evidence: string, risk = false): TestReadinessSignal {
  return {
    label,
    status: ok ? 'pass' : risk ? 'risk' : 'missing',
    evidence,
  };
}

function allPracticeCards() {
  return Object.values(practiceCards).flat();
}

function findPracticeCardById(id: string): PracticeCard | undefined {
  return allPracticeCards().find((card) => card.id === id);
}

function bestEvaluation<T>(items: T[], evaluate: (item: T) => SkillEvaluation | null) {
  return items
    .map(evaluate)
    .filter((item): item is SkillEvaluation => Boolean(item))
    .sort((a, b) => b.score - a.score)[0];
}

function proofReady(evaluation: SkillEvaluation | undefined) {
  return Boolean(evaluation && evaluation.band === 'ready' && evaluation.proofChecks.every((check) => check.passed));
}

export function generateTestReadinessReport(state: AppState, now = new Date()): TestReadinessReport {
  const daysLeft = daysUntil(state.profile.testDate, now);
  const gates = getSprintReadinessGates(state);
  const passedGates = gates.filter((gate) => gate.done).length;
  const latestMock = latestSubmittedMock(state.miniMockAttempts);
  const accuracy = objectiveAccuracy(latestMock);
  const audioBackedSpeaking = state.speakingAttempts.filter((attempt) => attempt.hasAudioEvidence).length;
  const writingReps = state.writingDrafts.length + state.practiceHistory.filter((item) => item.section === 'writing').length;
  const bestSpeaking = bestEvaluation(state.speakingAttempts, (attempt) => {
    const card = findPracticeCardById(attempt.promptId);
    return card ? evaluateSpeakingAttempt(card, attempt.selfRating, attempt.notes, Boolean(attempt.hasAudioEvidence)) : null;
  });
  const bestWriting = bestEvaluation(state.writingDrafts, (draft) => {
    const card = findPracticeCardById(draft.promptId);
    return card ? evaluateWritingAttempt(card, draft.draft, draft.revision) : null;
  });
  const speakingQualityReady = proofReady(bestSpeaking);
  const writingQualityReady = proofReady(bestWriting);
  const activeErrors = state.errorLog.filter((entry) => !entry.corrected).length;
  const nextAction = getSprintNextAction(state);
  const mockScore = latestMock?.score ?? null;
  const latestMockTimed = Boolean(latestMock?.timed);

  const strongMock = Boolean(accuracy && accuracy.ratio >= 0.75 && (mockScore === null || mockScore >= 0.65));
  const hasMinimumEvidence =
    state.diagnosticCompleted &&
    Boolean(latestMock) &&
    latestMockTimed &&
    audioBackedSpeaking >= 1 &&
    writingReps >= 2 &&
    speakingQualityReady &&
    writingQualityReady;
  const evidenceScore = Math.round(
    Math.min(
      1,
      passedGates / gates.length * 0.45 +
        (accuracy?.ratio ?? 0) * 0.25 +
        (latestMockTimed ? 0.1 : 0) +
        Math.min(audioBackedSpeaking, 2) * 0.07 +
        (speakingQualityReady ? 0.1 : 0) +
        Math.min(writingReps / 3, 1) * 0.08 +
        (writingQualityReady ? 0.1 : 0) +
        (activeErrors === 0 ? 0.05 : 0),
    ) * 100,
  );

  let verdict: TestReadinessVerdict = 'needs-proof';
  if (!state.diagnosticCompleted || !latestMock || !latestMockTimed || audioBackedSpeaking === 0 || !speakingQualityReady || !writingQualityReady) {
    verdict = 'blocked';
  } else if (hasMinimumEvidence && strongMock && activeErrors <= 2) {
    verdict = 'ready-to-sit';
  }

  const headline =
    verdict === 'ready-to-sit'
      ? 'Ready to sit with final review only'
      : verdict === 'blocked'
        ? 'Not test-ready yet: required proof is missing'
        : 'Close, but finish the proof loop before trusting readiness';

  const summary =
    verdict === 'ready-to-sit'
      ? 'The app has enough practice evidence to switch from learning new material to protecting timing, templates, and confidence.'
      : verdict === 'blocked'
        ? 'Do not trust a readiness score until diagnostic, mini mock, recorded speaking, and ready-quality writing/speaking proof are present.'
        : 'You have useful progress, but one or more proof signals still need repair before the test.';

  const nextActionLabel = nextAction.type === 'mock' ? `Proof set: ${nextAction.title}` : `Repair drill: ${nextAction.title}`;

  return {
    verdict,
    headline,
    summary,
    daysLeft,
    evidenceScore,
    signals: [
      signal('Diagnostic baseline', state.diagnosticCompleted, state.diagnosticCompleted ? 'Saved' : 'Missing baseline'),
      signal(
        'Mini mock proof',
        Boolean(latestMock),
        latestMock
          ? `${accuracy?.correct ?? 0}/${accuracy?.total ?? 0} objective, ${mockScore === null ? 'no score signal' : `${Math.round(mockScore * 100)}/100 score signal`}`
          : 'No submitted mini mock',
      ),
      signal('Timed mock pressure', latestMockTimed, latestMockTimed ? `${Math.round((latestMock?.elapsedSeconds ?? 0) / 60)} min elapsed` : 'No timed mini mock', Boolean(latestMock) && !latestMockTimed),
      signal('Recorded speaking evidence', audioBackedSpeaking >= 1, `${audioBackedSpeaking}/1 audio-backed attempt`),
      signal('Speaking quality proof', speakingQualityReady, bestSpeaking ? `${Math.round(bestSpeaking.score * 100)}/100 ${bestSpeaking.band}` : 'No scored speaking attempt', Boolean(bestSpeaking) && !speakingQualityReady),
      signal('Writing repetitions', writingReps >= 2, `${writingReps}/2 writing reps`),
      signal('Writing quality proof', writingQualityReady, bestWriting ? `${Math.round(bestWriting.score * 100)}/100 ${bestWriting.band}` : 'No scored writing draft', Boolean(bestWriting) && !writingQualityReady),
      signal('Open repair load', activeErrors <= 2, `${activeErrors} active errors`, activeErrors > 2),
      signal('Time pressure', daysLeft >= 0, daysLeft >= 0 ? `${daysLeft} days left` : 'Test date has passed', daysLeft <= 1),
    ],
    finalChecklist: [
      'Complete the next action shown below before doing any extra study.',
      'Use the mini mock timer; untimed work does not count as final proof.',
      'Record one timed speaking answer and play it back for clarity and final sentence.',
      'Write one 10-minute discussion response; revise only structure, support, and grammar pattern errors.',
      'Review active error cards and stop when the same repair rule appears twice.',
      'On the final night, review templates and sleep; do not start new content.',
    ],
    nextActionLabel,
    nextActionReason: nextAction.reason,
  };
}

export function generateTestDayPlan(state: AppState, now = new Date()): TestDayPlan {
  const report = generateTestReadinessReport(state, now);
  const available = Math.min(Math.max(state.profile.dailyMinutes, 45), 120);
  const proofMinutes = Math.min(35, Math.max(20, Math.round(available * 0.35)));
  const repairMinutes = Math.min(35, Math.max(15, Math.round(available * 0.3)));
  const templateMinutes = Math.min(25, Math.max(10, Math.round(available * 0.2)));

  if (report.verdict === 'ready-to-sit') {
    return {
      title: 'Final review only',
      summary: 'The goal is to preserve timing and confidence. Do not start new content.',
      blocks: [
        {
          title: 'Template recall',
          minutes: templateMinutes,
          mode: 'template',
          instruction: 'Say the speaking opening, integrated-source frame, and writing discussion frame from memory.',
        },
        {
          title: 'One light repair pass',
          minutes: repairMinutes,
          mode: 'repair',
          instruction: 'Review active error cards only; stop after the same repair rule appears twice.',
        },
        {
          title: 'Stop rule',
          minutes: 0,
          mode: 'rest',
          instruction: 'Stop heavy study, prepare documents, and protect sleep.',
        },
      ],
      avoid: ['Full new mock tests', 'New grammar topics', 'Late-night score prediction', 'Repeating already-correct sections'],
    };
  }

  const speakingQuality = report.signals.find((item) => item.label === 'Speaking quality proof');
  const writingQuality = report.signals.find((item) => item.label === 'Writing quality proof');
  const firstBlock: TestDayPlanBlock =
    speakingQuality?.status !== 'pass'
      ? {
          title: 'Trusted speaking proof',
          minutes: 10,
          mode: 'proof',
          instruction: 'Record one timed speaking answer, play it back, and save notes that prove source detail and a clean final sentence.',
        }
      : writingQuality?.status !== 'pass'
        ? {
            title: 'Trusted writing proof',
            minutes: repairMinutes,
            mode: 'repair',
            instruction: 'Write one 120-180 word discussion response, add a real revision pass, and save it before doing another proof set.',
          }
        : {
            title: report.nextActionLabel,
            minutes: proofMinutes,
            mode: report.nextActionLabel.startsWith('Proof set') ? 'proof' : 'repair',
            instruction: report.nextActionReason,
          };

  return {
    title: report.verdict === 'blocked' ? 'Proof-first emergency plan' : 'Repair-first final plan',
    summary: report.verdict === 'blocked'
      ? 'The app is missing required proof. Finish the exact proof action before any extra practice.'
      : 'The app has partial proof. Repair the largest leak, then stop before fatigue creates false signals.',
    blocks: [
      firstBlock,
      ...(firstBlock.title === 'Trusted speaking proof'
        ? []
        : [
            {
              title: 'Timed speaking proof',
              minutes: 10,
              mode: 'proof' as const,
              instruction: 'Record one 45-60 second answer, play it back, and confirm the final sentence is complete.',
            },
          ]),
      ...(firstBlock.title === 'Trusted writing proof'
        ? []
        : [
            {
              title: 'Writing structure pass',
              minutes: repairMinutes,
              mode: 'repair' as const,
              instruction: 'Write or revise one response for claim, concrete example, transitions, and one repeated grammar pattern.',
            },
          ]),
      {
        title: 'Template shutdown',
        minutes: templateMinutes,
        mode: 'template',
        instruction: 'Review only templates and personal repair rules. Stop when recall is smooth.',
      },
    ],
    avoid: ['Starting a new long study guide', 'Untimed mini mocks as proof', 'Fixing every weak topic', 'Studying past the stop rule'],
  };
}

export function buildTestWeekCommand(state: AppState, now = new Date()): TestWeekCommand {
  const report = generateTestReadinessReport(state, now);
  const plan = generateTestDayPlan(state, now);
  const personalProof = buildPersonalProofGate(state);

  if (!personalProof.ready) {
    const firstMissing = personalProof.missing[0] ?? 'personal proof';
    return {
      status: 'needs-proof',
      label: 'Finish the local proof loop first',
      primaryAction: `Complete: ${firstMissing}`,
      reason: personalProof.detail,
      stopRule: 'Do not trust readiness or add extra study until the personal proof gate is complete.',
    };
  }

  if (report.verdict === 'ready-to-sit') {
    const firstBlock = plan.blocks[0];
    return {
      status: 'final-review',
      label: 'Protect readiness',
      primaryAction: `${firstBlock.title}: ${firstBlock.instruction}`,
      reason: report.summary,
      stopRule: 'Stop after template recall and light repair; do not start new content.',
    };
  }

  const speakingQuality = report.signals.find((item) => item.label === 'Speaking quality proof');
  if (speakingQuality?.status !== 'pass') {
    return {
      status: 'proof',
      label: 'Produce trusted speaking proof',
      primaryAction: 'Record one timed speaking answer, play it back, and save notes that prove source detail and a clean final sentence.',
      reason: speakingQuality?.evidence ?? 'Speaking quality proof is missing.',
      stopRule: 'Do not take another mini mock until this speaking proof signal passes.',
    };
  }

  const writingQuality = report.signals.find((item) => item.label === 'Writing quality proof');
  if (writingQuality?.status !== 'pass') {
    return {
      status: 'repair',
      label: 'Produce trusted writing proof',
      primaryAction: 'Write one 120-180 word discussion response, add a real revision pass, and save it before doing another proof set.',
      reason: writingQuality?.evidence ?? 'Writing quality proof is missing.',
      stopRule: 'Do not count writing as ready until target length, support, task language, and revision evidence pass.',
    };
  }

  const needsProofSet = report.nextActionLabel.startsWith('Proof set');
  return {
    status: needsProofSet ? 'proof' : 'repair',
    label: needsProofSet ? 'Produce one trusted proof signal' : 'Repair the biggest leak',
    primaryAction: `${report.nextActionLabel}: ${report.nextActionReason}`,
    reason: report.summary,
    stopRule: 'After the command is done, update the app and follow the next generated action only.',
  };
}

export function formatLearnerReadinessReport(state: AppState, now = new Date()) {
  const report = generateTestReadinessReport(state, now);
  const plan = generateTestDayPlan(state, now);
  const personalProof = buildPersonalProofGate(state);
  const command = buildTestWeekCommand(state, now);
  const lines = [
    'TOEFL 120 Coach readiness report',
    `Generated: ${now.toISOString()}`,
    '',
    'Important: This is a practice-readiness report, not an official TOEFL score prediction.',
    '',
    `Verdict: ${report.headline}`,
    `Evidence score: ${report.evidenceScore}/100`,
    `Days left: ${report.daysLeft}`,
    `Summary: ${report.summary}`,
    '',
    'Proof signals:',
    ...report.signals.map((item) => `- ${item.label}: ${item.status.toUpperCase()} (${item.evidence})`),
    '',
    'Personal proof gate:',
    `- Status: ${personalProof.ready ? 'READY' : 'NEEDS PROOF'}`,
    `- ${personalProof.detail}`,
    ...(personalProof.missing.length
      ? ['- Missing:', ...personalProof.missing.map((item) => `  - ${item}`)]
      : ['- Local proof-of-concept loop complete']),
    '',
    'Test-week command:',
    `- ${command.label}`,
    `- Do now: ${command.primaryAction}`,
    `- Why: ${command.reason}`,
    `- Stop rule: ${command.stopRule}`,
    '',
    `Next action: ${report.nextActionLabel}`,
    `Why: ${report.nextActionReason}`,
    '',
    `Final operating plan: ${plan.title}`,
    plan.summary,
    ...plan.blocks.map((block) => `- ${block.title} [${block.mode}, ${block.minutes ? `${block.minutes} min` : 'stop rule'}]: ${block.instruction}`),
    '',
    'Do not do this before test day:',
    ...plan.avoid.map((item) => `- ${item}`),
  ];

  return `${lines.join('\n')}\n`;
}

export function formatFinalTemplateSheet(now = new Date()) {
  const sectionOrder = ['reading', 'listening', 'speaking', 'writing'] as const;
  const lines = [
    'TOEFL 120 Coach final template sheet',
    `Generated: ${now.toISOString()}`,
    '',
    'Use this for final review only. Do not start new content from this sheet.',
    '',
  ];

  for (const section of sectionOrder) {
    const playbook = sectionPlaybooks[section];
    lines.push(
      playbook.title,
      `Win condition: ${playbook.winCondition}`,
      'Note format:',
      ...playbook.noteFormat.map((item) => `- ${item}`),
      'Template:',
      ...playbook.template.map((item, index) => `${index + 1}. ${item}`),
      'Traps:',
      ...playbook.traps.map((item) => `- ${item}`),
      '',
    );
  }

  return `${lines.join('\n')}\n`;
}
