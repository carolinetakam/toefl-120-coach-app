import { describe, expect, it } from 'vitest';
import { getDiagnosticQuestions, getNextDiagnosticFormId } from '@/lib/diagnostic';
import { scoreDiagnostic } from '@/lib/logic';

function perfectAnswers(formId: string) {
  return Object.fromEntries(getDiagnosticQuestions(formId).map((question) => [question.id, question.answer]));
}

describe('diagnostic form rotation', () => {
  it('offers a fresh beta form without repeating baseline question ids', () => {
    const baseline = getDiagnosticQuestions('baseline');
    const freshBeta = getDiagnosticQuestions('fresh-beta');

    expect(freshBeta).toHaveLength(baseline.length);
    expect(new Set(freshBeta.map((question) => question.section))).toEqual(new Set(['reading', 'listening', 'speaking', 'writing']));
    expect(freshBeta.some((question) => baseline.some((known) => known.id === question.id))).toBe(false);
    const answerCounts = freshBeta.reduce(
      (counts, question) => counts.map((count, index) => count + (question.answer === index ? 1 : 0)),
      [0, 0, 0, 0],
    );

    expect(answerCounts.every((count) => count > 0)).toBe(true);
    expect(Math.max(...answerCounts) - Math.min(...answerCounts)).toBeLessThanOrEqual(1);
  });

  it('rotates away from the current form for retakes', () => {
    expect(getNextDiagnosticFormId('baseline')).toBe('fresh-beta');
    expect(getNextDiagnosticFormId('fresh-beta')).toBe('baseline');
  });

  it('alternates the diagnostic form on each completion', () => {
    expect(getNextDiagnosticFormId(getNextDiagnosticFormId('baseline'))).toBe('baseline');
  });

  it('scores the selected diagnostic form rather than the baseline only', () => {
    const result = scoreDiagnostic(perfectAnswers('fresh-beta'), getDiagnosticQuestions('fresh-beta'));

    expect(result.sectionScores).toEqual({
      reading: 1,
      listening: 1,
      speaking: 1,
      writing: 1,
    });
    expect(result.track).toBe('Test-readiness');
  });
});
