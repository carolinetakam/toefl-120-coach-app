import { describe, expect, it } from 'vitest';
import { evaluateMockAttempt, mockTests, scoreMockAnswers } from '@/lib/mock-tests';

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
    expect(evaluation.overall).toBe(60);
    expect(evaluation.feedback).toContain('Review');
    expect(evaluation.feedback).toContain('Speaking checklist is acceptable');
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
});
