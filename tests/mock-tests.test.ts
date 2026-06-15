import { describe, expect, it } from 'vitest';
import {
  canCollectIntegratedTaskAnswer,
  evaluateMockAttempt,
  estimateMockSpeakingScore,
  estimateMockWritingScore,
  mockTests,
  scoreMockAnswers,
  scoreMockAnswersBySection,
} from '@/lib/mock-tests';

describe('scoreMockAnswers', () => {
  it('scores linked mock objective questions deterministically', () => {
    const test = mockTests[0];
    const answers = Object.fromEntries(test.questions.map((question) => [question.id, question.answer]));

    expect(scoreMockAnswers(test, answers)).toEqual({
      correct: test.questions.length,
      total: test.questions.length,
      score: 1,
    });
  });

  it('keeps unanswered questions incorrect', () => {
    const test = mockTests[0];

    expect(scoreMockAnswers(test, {})).toEqual({
      correct: 0,
      total: test.questions.length,
      score: 0,
    });
  });

  it('does not put every correct answer in the same option position', () => {
    const answerPositions = new Set(mockTests[0].questions.map((question) => question.answer));

    expect(answerPositions.size).toBeGreaterThan(1);
  });

  it('provides four approved mini mock proof sets with balanced objective sections', () => {
    expect(mockTests).toHaveLength(4);
    for (const mock of mockTests) {
      expect(mock.listeningScript.length).toBeGreaterThan(80);
      expect(mock.speakingPrompt).toMatch(/60 seconds/i);
      expect(mock.writingPrompt).toMatch(/120-180|120-240|180-240/i);
      expect(mock.questions.filter((question) => question.section === 'reading')).toHaveLength(2);
      expect(mock.questions.filter((question) => question.section === 'listening')).toHaveLength(2);
      expect(new Set(mock.questions.map((question) => question.id)).size).toBe(mock.questions.length);
    }
  });

  it('uses each selected mock prompt for speaking and writing scoring helpers', () => {
    const first = mockTests[0];
    const final = mockTests[3];

    expect(estimateMockSpeakingScore(first, 3, first.speakingPrompt, true)).toBeGreaterThan(estimateMockSpeakingScore(final, 0, '', false));
    expect(estimateMockWritingScore(final, 'I think cities should prioritize trees because they reduce heat for people walking outside. For example, a bus stop with shade can be more comfortable in summer, so more residents can wait safely. This practical benefit is more important than adding a few parking spaces.')).toBeGreaterThan(0.5);
  });

  it('requires integrated mock tasks to have approved materials before collecting learner answers', () => {
    for (const mock of mockTests) {
      expect(canCollectIntegratedTaskAnswer(mock.speakingTask)).toBe(true);
      expect(canCollectIntegratedTaskAnswer(mock.writingTask)).toBe(true);
      expect(mock.speakingTask.materials.template?.length).toBeGreaterThan(20);
      expect(mock.writingTask.wordRange).toEqual({ min: 120, max: 180 });
    }

    const incomplete = {
      ...mockTests[0],
      speakingTask: {
        ...mockTests[0].speakingTask,
        responseMode: 'learner_answer' as const,
        materials: {},
      },
    };

    expect(canCollectIntegratedTaskAnswer(incomplete.speakingTask)).toBe(false);
    expect(() => estimateMockSpeakingScore(incomplete, 3, 'source detail and complete final sentence', true)).toThrow(/incomplete/i);
  });

  it('scores reading and listening objective sections separately', () => {
    const test = mockTests[0];
    const evaluation = scoreMockAnswersBySection(test, {
      'mock-r-1': 0,
      'mock-r-2': 2,
      'mock-l-1': 0,
      'mock-l-2': 0,
    });

    expect(evaluation.reading).toEqual({ correct: 2, total: 2, score: 1 });
    expect(evaluation.listening).toEqual({ correct: 0, total: 2, score: 0 });
  });

  it('evaluates a weak learner attempt with actionable feedback', () => {
    const test = mockTests[0];
    const evaluation = evaluateMockAttempt(
      test,
      {
        'mock-r-1': 0,
        'mock-r-2': 1,
        'mock-l-1': 1,
        'mock-l-2': 1,
      },
      1,
      'I explain grasses first and later trees. I pause many time and cannot say soil chemistry clearly.',
      'I think small discussion class is worth cost. In big lecture many student just listen and they cannot ask question. In small class teacher can know student problem and student speak more. For example, in my biology class I did not understand experiment, but small group help me ask friend and teacher. So university should use small class even it is expensive.',
    );

    expect(evaluation.objectiveCorrect).toBe(2);
    expect(evaluation.overall).toBeLessThan(60);
    expect(evaluation.feedback).toContain('Review');
    expect(evaluation.feedback).toContain('Redo speaking');
  });

  it('penalizes underdeveloped writing even when it has enough words', () => {
    const weak = evaluateMockAttempt(
      mockTests[0],
      {},
      0,
      '',
      'Small class is good. Small class is good. Small class is good. Small class is good. Small class is good. Small class is good. Small class is good. Small class is good. Small class is good. Small class is good. Small class is good. Small class is good.',
    );
    const stronger = evaluateMockAttempt(
      mockTests[0],
      {},
      0,
      '',
      'I think smaller discussion classes are worth the cost because students participate more actively. In a large lecture, many students listen quietly and do not ask questions when they are confused. For example, in a biology class, a small discussion group could let a student explain an experiment and get correction from the teacher. This support can make the extra cost reasonable.',
    );

    expect(stronger.writingScore).toBeGreaterThan(weak.writingScore);
  });

  it('keeps mock speaking provisional when checklist evidence has no recording', () => {
    const noAudio = evaluateMockAttempt(
      mockTests[0],
      Object.fromEntries(mockTests[0].questions.map((question) => [question.id, question.answer])),
      3,
      'First, I explain the professor reason and source detail. I finish with a complete final sentence.',
      'I think smaller discussion classes are worth the cost because students participate more actively. For example, a biology student can ask about a confusing experiment and get correction before the exam. This makes the extra cost reasonable because the class produces stronger learning.',
      false,
    );
    const withAudio = evaluateMockAttempt(
      mockTests[0],
      Object.fromEntries(mockTests[0].questions.map((question) => [question.id, question.answer])),
      3,
      'First, I explain the professor reason and source detail. I finish with a complete final sentence.',
      'I think smaller discussion classes are worth the cost because students participate more actively. For example, a biology student can ask about a confusing experiment and get correction before the exam. This makes the extra cost reasonable because the class produces stronger learning.',
      true,
    );

    expect(noAudio.speakingScore).toBeLessThan(withAudio.speakingScore);
    expect(noAudio.feedback).toMatch(/Record one Practice > Speaking attempt/i);
    expect(withAudio.feedback).toMatch(/recorded practice attempt/i);
  });
});
