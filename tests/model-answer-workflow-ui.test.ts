import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const coachAppSource = readFileSync(join(root, 'components/coach-app.tsx'), 'utf8');
const modelAnswerSource = readFileSync(join(root, 'components/model-answer/model-answer-card.tsx'), 'utf8');
const comparisonSource = readFileSync(join(root, 'components/model-answer/answer-comparison-card.tsx'), 'utf8');
const expectationsSource = readFileSync(join(root, 'components/model-answer/ets-expectations-card.tsx'), 'utf8');

describe('model answer workflow UI contract', () => {
  it('wires model answer and ETS expectation cards into in-task speaking and writing surfaces', () => {
    expect(coachAppSource.match(/<ModelAnswerCard/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
    expect(coachAppSource.match(/<ETSExpectationsCard/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
    expect(coachAppSource).toContain('currentCard.modelAnswer');
    expect(coachAppSource).toContain('currentMock.speakingTask.modelAnswer');
    expect(coachAppSource).toContain('currentMock.writingTask.modelAnswer');
  });

  it('renders comparison workflow only after speaking, writing, or mini mock submission state exists', () => {
    expect(coachAppSource).toContain('lastWritingEvaluation && (');
    expect(coachAppSource).toContain('lastSpeakingEvaluation && (');
    expect(coachAppSource).toContain('mockSubmitted && (');
    expect(coachAppSource.match(/<AnswerComparisonCard/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
    expect(comparisonSource).toContain('Your Answer');
    expect(comparisonSource).toContain('Sample Answer');
    expect(comparisonSource).toContain('Comparison checklist');
  });

  it('keeps the workflow as checklist comparison without AI or official score claims', () => {
    const workflowSource = [coachAppSource, modelAnswerSource, comparisonSource, expectationsSource].join('\n');
    expect(workflowSource).not.toMatch(/\bAI scoring\b|\bGPT feedback\b|\baudio-based scoring\b/i);
    expect(modelAnswerSource).not.toMatch(/\bofficial\b|\bscore prediction\b/i);
    expect(comparisonSource).not.toMatch(/\bofficial\b|\bscore prediction\b/i);
    expect(comparisonSource).toContain('type="checkbox"');
    expect(comparisonSource).not.toMatch(/\bscore\b/i);
  });
});
