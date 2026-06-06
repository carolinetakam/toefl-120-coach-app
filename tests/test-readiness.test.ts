import { describe, expect, it } from 'vitest';
import { buildTestWeekCommand, formatFinalTemplateSheet, formatLearnerReadinessReport, generateTestDayPlan, generateTestReadinessReport } from '@/lib/test-readiness';
import { initialState } from '@/lib/seed';
import { AppState, MiniMockAttempt } from '@/lib/types';

const submittedPerfectMock: MiniMockAttempt = {
  mockId: 'mock-campus-ecology-1',
  answers: {
    'mock-r-1': 0,
    'mock-r-2': 2,
    'mock-l-1': 1,
    'mock-l-2': 3,
  },
  notes: 'compact notes',
  speakingNotes: 'clear structure and finish',
  writing: 'I think discussion classes are worth the cost because students receive more feedback. For example, in a lecture hall, a quiet student may never ask questions, but in a smaller class the professor can notice confusion and respond quickly. This makes the extra cost useful when the course requires analysis rather than memorization.',
  rubric: {
    'Clear main idea': true,
    'Source detail included': true,
    'Finished cleanly': true,
  },
  submitted: true,
  submittedAt: '2026-06-04T10:00:00.000Z',
  score: 0.82,
  elapsedSeconds: 1180,
  timed: true,
  updatedAt: '2026-06-04T10:00:00.000Z',
};

function readyState(): AppState {
  return {
    ...initialState,
    onboarded: true,
    diagnosticCompleted: true,
    reviewQueue: [
      {
        id: 'review-1',
        section: 'reading',
        subskill: 'inference',
        prompt: 'Why did this inference need stronger text evidence?',
        answer: 'The answer must connect to a stated detail, not a topic guess.',
        dueDate: '2026-06-05T00:00:00.000Z',
        interval: 1,
      },
    ],
    miniMockAttempts: [submittedPerfectMock],
    speakingAttempts: [
      {
        promptId: 'pr-s-2',
        selfRating: 5,
        notes: 'First, I choose an early morning class because my focus is strongest before other campus tasks. For example, a student can finish the important lecture, review the reason immediately, and still have the afternoon for homework. I finish with a complete final sentence.',
        hasAudioEvidence: true,
      },
      { promptId: 'pr-s-4', selfRating: 4, notes: 'clear stress and pacing', hasAudioEvidence: false },
      { promptId: 'pr-s-6', selfRating: 4, notes: 'source detail included', hasAudioEvidence: false },
    ],
    writingDrafts: [
      {
        promptId: 'pr-w-3',
        draft: 'I think mandatory community service is a good idea because it gives students practical contact with people outside their normal class routine. In a discussion, this point adds something beyond civic responsibility because it connects service to career skills. For example, a computer science student who tutors children may learn how to explain difficult ideas clearly and adjust when someone is confused. That skill can help later in team projects, internships, and customer conversations. Some students are busy, but universities can keep the requirement small, flexible, and connected to major-related work. The class could also let students choose service related to their field, so the work feels useful rather than random. Therefore, service is useful when it becomes a structured class experience instead of a punishment.',
        revision: 'I made the example more concrete, connected it back to student learning, and clarified why flexibility answers the workload objection in the discussion.',
        score: 0.8,
      },
      {
        promptId: 'pr-w-4',
        draft: 'I believe recorded lectures should be available because students can review difficult class material after the first explanation. For example, a student who misses one chemistry step can replay only that part and then ask a better question later. This does not replace attendance because discussions and quizzes still happen in class. It makes learning more reliable.',
        revision: 'I clarified the attendance limit and made the example consequence more specific.',
        score: 0.75,
      },
    ],
    practiceHistory: [
      { id: 'r1', section: 'reading', subskill: 'inference', score: 1, completedAt: '2026-06-04T09:00:00.000Z', notes: '', supported: true },
      { id: 'r2', section: 'reading', subskill: 'rhetorical purpose', score: 1, completedAt: '2026-06-04T09:01:00.000Z', notes: '', supported: true },
      { id: 'r3', section: 'reading', subskill: 'vocabulary in context', score: 1, completedAt: '2026-06-04T09:02:00.000Z', notes: '', supported: true },
      { id: 'l1', section: 'listening', subskill: 'gist', score: 1, completedAt: '2026-06-04T09:05:00.000Z', notes: '', supported: true },
      { id: 'l2', section: 'listening', subskill: 'detail', score: 1, completedAt: '2026-06-04T09:06:00.000Z', notes: '', supported: true },
      { id: 'l3', section: 'listening', subskill: 'organization', score: 1, completedAt: '2026-06-04T09:07:00.000Z', notes: '', supported: true },
      { id: 'm1', section: 'reading', subskill: 'mini mock', score: 0.82, completedAt: '2026-06-04T10:00:00.000Z', notes: '', supported: true },
    ],
  };
}

describe('test-week readiness report', () => {
  it('blocks readiness for new users with missing proof', () => {
    const report = generateTestReadinessReport(initialState, new Date('2026-06-04T09:00:00+09:00'));

    expect(report.verdict).toBe('blocked');
    expect(report.headline).toMatch(/required proof is missing/i);
    expect(report.signals.find((signal) => signal.label === 'Mini mock proof')?.status).toBe('missing');
    expect(report.signals.find((signal) => signal.label === 'Recorded speaking evidence')?.status).toBe('missing');
  });

  it('does not treat an untimed mini mock as final test proof', () => {
    const state = {
      ...readyState(),
      miniMockAttempts: [{ ...submittedPerfectMock, timed: false, elapsedSeconds: undefined }],
    };

    const report = generateTestReadinessReport(state, new Date('2026-06-04T09:00:00+09:00'));

    expect(report.verdict).toBe('blocked');
    expect(report.signals.find((signal) => signal.label === 'Timed mock pressure')?.status).toBe('risk');
  });

  it('marks strong proof as ready to sit without claiming an official TOEFL score', () => {
    const report = generateTestReadinessReport(readyState(), new Date('2026-06-04T09:00:00+09:00'));

    expect(report.verdict).toBe('ready-to-sit');
    expect(report.headline).toMatch(/final review only/i);
    expect(report.evidenceScore).toBeGreaterThanOrEqual(80);
    expect(report.summary).not.toMatch(/official TOEFL score/i);
    expect(report.signals.find((signal) => signal.label === 'Speaking quality proof')?.status).toBe('pass');
    expect(report.signals.find((signal) => signal.label === 'Writing quality proof')?.status).toBe('pass');
  });

  it('blocks final readiness when speaking evidence is present but not ready-quality', () => {
    const state = {
      ...readyState(),
      speakingAttempts: [{ promptId: 'pr-s-2', selfRating: 5, notes: 'I pause and my intro is too long.', hasAudioEvidence: true }],
    };

    const report = generateTestReadinessReport(state, new Date('2026-06-04T09:00:00+09:00'));

    expect(report.verdict).toBe('blocked');
    expect(report.signals.find((signal) => signal.label === 'Recorded speaking evidence')?.status).toBe('pass');
    expect(report.signals.find((signal) => signal.label === 'Speaking quality proof')?.status).toBe('risk');
  });

  it('blocks final readiness when writing reps exist but no draft is ready-quality', () => {
    const state = {
      ...readyState(),
      writingDrafts: [
        { promptId: 'pr-w-3', draft: 'Service is good. Service is useful.', revision: '', score: 0.4 },
        { promptId: 'pr-w-4', draft: 'Recorded lecture is good. Students like it.', revision: '', score: 0.4 },
      ],
    };

    const report = generateTestReadinessReport(state, new Date('2026-06-04T09:00:00+09:00'));

    expect(report.verdict).toBe('blocked');
    expect(report.signals.find((signal) => signal.label === 'Writing repetitions')?.status).toBe('pass');
    expect(report.signals.find((signal) => signal.label === 'Writing quality proof')?.status).toBe('risk');
  });

  it('keeps the exact next action attached to the report', () => {
    const state = {
      ...readyState(),
      speakingAttempts: [],
    };

    const report = generateTestReadinessReport(state, new Date('2026-06-04T09:00:00+09:00'));

    expect(report.verdict).toBe('blocked');
    expect(report.nextActionLabel).toMatch(/Repair drill/i);
    expect(report.nextActionReason).toMatch(/record/i);
  });

  it('creates a final-review-only plan when evidence is strong', () => {
    const plan = generateTestDayPlan(readyState(), new Date('2026-06-04T09:00:00+09:00'));

    expect(plan.title).toBe('Final review only');
    expect(plan.blocks.map((block) => block.mode)).toContain('rest');
    expect(plan.avoid).toContain('Full new mock tests');
  });

  it('creates a proof-first emergency plan when readiness is blocked', () => {
    const plan = generateTestDayPlan(initialState, new Date('2026-06-04T09:00:00+09:00'));

    expect(plan.title).toBe('Proof-first emergency plan');
    expect(plan.blocks[0].mode).toBe('proof');
    expect(plan.avoid).toContain('Untimed mini mocks as proof');
  });

  it('puts trusted speaking proof first when speaking quality is weak', () => {
    const plan = generateTestDayPlan({
      ...readyState(),
      speakingAttempts: [{ promptId: 'pr-s-2', selfRating: 5, notes: 'I pause and my intro is too long.', hasAudioEvidence: true }],
    }, new Date('2026-06-04T09:00:00+09:00'));

    expect(plan.blocks[0]).toMatchObject({
      title: 'Trusted speaking proof',
      mode: 'proof',
    });
    expect(plan.blocks.map((block) => block.title)).not.toContain('Timed speaking proof');
  });

  it('puts trusted writing proof first when writing quality is weak', () => {
    const plan = generateTestDayPlan({
      ...readyState(),
      writingDrafts: [
        { promptId: 'pr-w-3', draft: 'Service is good. Service is useful.', revision: '', score: 0.4 },
        { promptId: 'pr-w-4', draft: 'Recorded lecture is good. Students like it.', revision: '', score: 0.4 },
      ],
    }, new Date('2026-06-04T09:00:00+09:00'));

    expect(plan.blocks[0]).toMatchObject({
      title: 'Trusted writing proof',
      mode: 'repair',
    });
    expect(plan.blocks.map((block) => block.title)).not.toContain('Writing structure pass');
  });

  it('turns missing personal proof into the top test-week command', () => {
    const command = buildTestWeekCommand(initialState, new Date('2026-06-04T09:00:00+09:00'));

    expect(command.status).toBe('needs-proof');
    expect(command.label).toMatch(/local proof loop/i);
    expect(command.primaryAction).toMatch(/Complete:/);
    expect(command.stopRule).toMatch(/Do not trust readiness/i);
  });

  it('switches the test-week command to final review when proof is strong', () => {
    const command = buildTestWeekCommand(readyState(), new Date('2026-06-04T09:00:00+09:00'));

    expect(command.status).toBe('final-review');
    expect(command.label).toBe('Protect readiness');
    expect(command.primaryAction).toMatch(/Template recall/);
    expect(command.stopRule).toMatch(/do not start new content/i);
  });

  it('points the test-week command at speaking proof when speaking quality is weak', () => {
    const command = buildTestWeekCommand({
      ...readyState(),
      speakingAttempts: [{ promptId: 'pr-s-2', selfRating: 5, notes: 'I pause and my intro is too long.', hasAudioEvidence: true }],
    }, new Date('2026-06-04T09:00:00+09:00'));

    expect(command.status).toBe('proof');
    expect(command.label).toMatch(/speaking proof/i);
    expect(command.primaryAction).toMatch(/Record one timed speaking/i);
    expect(command.stopRule).toMatch(/mini mock/i);
  });

  it('points the test-week command at writing proof when writing quality is weak', () => {
    const command = buildTestWeekCommand({
      ...readyState(),
      writingDrafts: [
        { promptId: 'pr-w-3', draft: 'Service is good. Service is useful.', revision: '', score: 0.4 },
        { promptId: 'pr-w-4', draft: 'Recorded lecture is good. Students like it.', revision: '', score: 0.4 },
      ],
    }, new Date('2026-06-04T09:00:00+09:00'));

    expect(command.status).toBe('repair');
    expect(command.label).toMatch(/writing proof/i);
    expect(command.primaryAction).toMatch(/120-180 word discussion response/i);
    expect(command.stopRule).toMatch(/target length/i);
  });

  it('formats a learner-readable readiness report for export', () => {
    const report = formatLearnerReadinessReport(readyState(), new Date('2026-06-04T09:00:00.000Z'));

    expect(report).toContain('TOEFL 120 Coach readiness report');
    expect(report).toContain('not an official TOEFL score prediction');
    expect(report).toContain('Proof signals:');
    expect(report).toContain('Timed mock pressure: PASS');
    expect(report).toContain('Personal proof gate:');
    expect(report).toContain('Status: READY');
    expect(report).toContain('Local proof-of-concept loop complete');
    expect(report).toContain('Test-week command:');
    expect(report).toContain('Do now: Template recall');
    expect(report).toContain('Final operating plan: Final review only');
    expect(report).toContain('Do not do this before test day:');
  });

  it('includes missing personal proof items in the learner export', () => {
    const report = formatLearnerReadinessReport(initialState, new Date('2026-06-04T09:00:00.000Z'));

    expect(report).toContain('Personal proof gate:');
    expect(report).toContain('Status: NEEDS PROOF');
    expect(report).toContain('Missing:');
    expect(report).toContain('Mini mock proof');
  });

  it('formats a final template sheet from approved section playbooks', () => {
    const sheet = formatFinalTemplateSheet(new Date('2026-06-04T09:00:00.000Z'));

    expect(sheet).toContain('TOEFL 120 Coach final template sheet');
    expect(sheet).toContain('Use this for final review only');
    expect(sheet).toContain('Reading: synonym and evidence game');
    expect(sheet).toContain('Listening: structure before details');
    expect(sheet).toContain('Speaking: template removes hesitation');
    expect(sheet).toContain('Writing: scaffold, then revise');
    expect(sheet).toContain('Personally, I think');
    expect(sheet).toContain('The topic has generated discussion');
  });
});
