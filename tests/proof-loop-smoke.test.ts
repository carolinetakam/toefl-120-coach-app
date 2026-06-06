import { describe, expect, it } from 'vitest';
import { formatProgressBackup, parseProgressBackup } from '@/lib/backup';
import { buildPersonalProofGate } from '@/lib/first-user-loop';
import { initialState } from '@/lib/seed';
import { buildTestWeekCommand, generateTestReadinessReport } from '@/lib/test-readiness';
import { AppState, MiniMockAttempt } from '@/lib/types';

const submittedProofMock: MiniMockAttempt = {
  mockId: 'mock-campus-ecology-1',
  answers: {
    'mock-r-1': 0,
    'mock-r-2': 2,
    'mock-l-1': 1,
    'mock-l-2': 3,
  },
  notes: 'main idea, contrast, examples',
  speakingNotes: 'clear finish',
  writing: 'Discussion response with one clear position, one concrete example, and a clean close.',
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

function firstUserProofState(): AppState {
  return {
    ...initialState,
    onboarded: true,
    diagnosticCompleted: true,
    reviewQueue: [
      {
        id: 'review-reading-1',
        section: 'reading',
        subskill: 'inference',
        prompt: 'What made the inference answer text-supported?',
        answer: 'It used the stated evidence instead of a topic guess.',
        dueDate: '2026-06-05T00:00:00.000Z',
        interval: 1,
      },
    ],
    miniMockAttempts: [submittedProofMock],
    speakingAttempts: [
      {
        promptId: 'pr-s-2',
        selfRating: 5,
        notes: 'First, I choose an early morning class because my focus is strongest before other campus tasks. For example, a student can finish the important lecture, review the reason immediately, and still have the afternoon for homework. I finish with a complete final sentence.',
        hasAudioEvidence: true,
      },
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
      { id: 'read-1', section: 'reading', subskill: 'inference', score: 1, completedAt: '2026-06-04T09:00:00.000Z', notes: '', supported: true },
      { id: 'listen-1', section: 'listening', subskill: 'gist', score: 1, completedAt: '2026-06-04T09:05:00.000Z', notes: '', supported: true },
      { id: 'mock-1', section: 'reading', subskill: 'mini mock', score: 0.82, completedAt: '2026-06-04T10:00:00.000Z', notes: '', supported: true },
    ],
  };
}

describe('first-user proof loop smoke', () => {
  it('round-trips saved progress and still proves the test-week loop', () => {
    const restored = parseProgressBackup(formatProgressBackup(firstUserProofState(), '2026-06-04T12:00:00.000Z'));
    const personalProof = buildPersonalProofGate(restored);
    const readiness = generateTestReadinessReport(restored, new Date('2026-06-04T09:00:00+09:00'));
    const command = buildTestWeekCommand(restored, new Date('2026-06-04T09:00:00+09:00'));

    expect(personalProof.ready).toBe(true);
    expect(readiness.verdict).toBe('ready-to-sit');
    expect(readiness.signals.find((signal) => signal.label === 'Speaking quality proof')?.status).toBe('pass');
    expect(readiness.signals.find((signal) => signal.label === 'Writing quality proof')?.status).toBe('pass');
    expect(command.status).toBe('final-review');
  });

  it('fails the smoke loop when restored writing proof is weak', () => {
    const weakState = {
      ...firstUserProofState(),
      writingDrafts: [
        { promptId: 'pr-w-3', draft: 'Service is good. Service is useful.', revision: '', score: 0.4 },
        { promptId: 'pr-w-4', draft: 'Recorded lectures help.', revision: '', score: 0.4 },
      ],
    };
    const restored = parseProgressBackup(formatProgressBackup(weakState, '2026-06-04T12:00:00.000Z'));
    const readiness = generateTestReadinessReport(restored, new Date('2026-06-04T09:00:00+09:00'));
    const command = buildTestWeekCommand(restored, new Date('2026-06-04T09:00:00+09:00'));

    expect(readiness.verdict).toBe('blocked');
    expect(readiness.signals.find((signal) => signal.label === 'Writing quality proof')?.status).toBe('risk');
    expect(command.status).toBe('repair');
    expect(command.label).toMatch(/writing proof/i);
  });
});
