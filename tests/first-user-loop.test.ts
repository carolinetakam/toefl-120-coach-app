import { describe, expect, it } from 'vitest';
import { buildPersonalProofGate, getFirstUserLoopSteps, hasUserProgress } from '@/lib/first-user-loop';
import { initialState } from '@/lib/seed';
import { AppState } from '@/lib/types';

describe('first-user-ready loop', () => {
  it('starts a new learner at profile setup', () => {
    const steps = getFirstUserLoopSteps(initialState);

    expect(steps.map((step) => `${step.label}:${step.status}`)).toEqual([
      'Profile:Current',
      'Diagnostic:Next',
      'Review:Next',
      'Next drill:Next',
      'Saved progress:Next',
    ]);
    expect(hasUserProgress(initialState)).toBe(false);
  });

  it('moves the learner into diagnostic after profile setup', () => {
    const steps = getFirstUserLoopSteps({ ...initialState, onboarded: true });

    expect(steps.find((step) => step.label === 'Profile')?.status).toBe('Complete');
    expect(steps.find((step) => step.label === 'Diagnostic')?.status).toBe('Current');
    expect(steps.find((step) => step.label === 'Saved progress')?.status).toBe('Complete');
  });

  it('marks the proof-of-concept loop complete when review, drill, and saved progress exist', () => {
    const proofState: AppState = {
      ...initialState,
      onboarded: true,
      diagnosticCompleted: true,
      reviewQueue: [
        {
          id: 'review-1',
          section: 'reading',
          subskill: 'inference',
          prompt: 'repair prompt',
          answer: 'repair answer',
          dueDate: '2026-06-05T00:00:00.000Z',
          interval: 1,
        },
      ],
      practiceHistory: [
        {
          id: 'practice-1',
          section: 'reading',
          subskill: 'inference',
          score: 1,
          completedAt: '2026-06-05T00:00:00.000Z',
          notes: '',
          supported: true,
        },
      ],
    };
    const steps = getFirstUserLoopSteps(proofState);

    expect(steps.every((step) => step.status === 'Complete')).toBe(true);
  });

  it('keeps personal proof blocked until a mini mock proof exists', () => {
    const gate = buildPersonalProofGate({
      ...initialState,
      onboarded: true,
      diagnosticCompleted: true,
      reviewQueue: [
        {
          id: 'review-1',
          section: 'reading',
          subskill: 'inference',
          prompt: 'repair prompt',
          answer: 'repair answer',
          dueDate: '2026-06-05T00:00:00.000Z',
          interval: 1,
        },
      ],
      practiceHistory: [
        {
          id: 'practice-1',
          section: 'reading',
          subskill: 'inference',
          score: 1,
          completedAt: '2026-06-05T00:00:00.000Z',
          notes: '',
          supported: true,
        },
      ],
    });

    expect(gate.ready).toBe(false);
    expect(gate.missing).toContain('Mini mock proof');
  });

  it('does not count an unsubmitted timed mini mock as proof', () => {
    const gate = buildPersonalProofGate({
      ...initialState,
      onboarded: true,
      diagnosticCompleted: true,
      reviewQueue: [
        {
          id: 'review-1',
          section: 'reading',
          subskill: 'inference',
          prompt: 'repair prompt',
          answer: 'repair answer',
          dueDate: '2026-06-05T00:00:00.000Z',
          interval: 1,
        },
      ],
      practiceHistory: [
        {
          id: 'practice-1',
          section: 'reading',
          subskill: 'inference',
          score: 1,
          completedAt: '2026-06-05T00:00:00.000Z',
          notes: '',
          supported: true,
        },
      ],
      miniMockAttempts: [
        {
          mockId: 'mock-campus-policy-3',
          answers: {},
          notes: '',
          speakingNotes: '',
          writing: '',
          rubric: {},
          submitted: false,
          elapsedSeconds: 120,
          timed: true,
          updatedAt: '2026-06-05T00:00:00.000Z',
        },
      ],
    });

    expect(gate.ready).toBe(false);
    expect(gate.missing).toContain('Mini mock proof');
  });

  it('marks personal proof ready when the loop and mini mock proof are complete', () => {
    const gate = buildPersonalProofGate({
      ...initialState,
      onboarded: true,
      diagnosticCompleted: true,
      reviewQueue: [
        {
          id: 'review-1',
          section: 'reading',
          subskill: 'inference',
          prompt: 'repair prompt',
          answer: 'repair answer',
          dueDate: '2026-06-05T00:00:00.000Z',
          interval: 1,
        },
      ],
      practiceHistory: [
        {
          id: 'mock-1',
          section: 'listening',
          subskill: 'mini mock',
          score: 0.8,
          completedAt: '2026-06-05T00:00:00.000Z',
          notes: '',
          supported: true,
        },
      ],
    });

    expect(gate.ready).toBe(true);
    expect(gate.label).toMatch(/ready/i);
  });
});
