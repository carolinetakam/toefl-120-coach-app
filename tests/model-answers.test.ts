import { describe, expect, it } from 'vitest';
import { mockTests } from '@/lib/mock-tests';
import { practiceCards } from '@/lib/seed';
import { ModelAnswer } from '@/lib/types';

function expectCompleteModelAnswer(modelAnswer: ModelAnswer | undefined) {
  expect(modelAnswer, 'missing modelAnswer').toBeDefined();
  expect(modelAnswer?.scoreBand).toMatch(/4\/5|high/i);
  expect(modelAnswer?.response.trim().split(/\s+/).length).toBeGreaterThan(20);
  expect(modelAnswer?.strengths.length).toBeGreaterThanOrEqual(3);
  expect(modelAnswer?.structure.length).toBeGreaterThanOrEqual(3);
}

describe('model answer coverage', () => {
  it('covers every speaking and writing practice card', () => {
    for (const card of [...practiceCards.speaking, ...practiceCards.writing]) {
      expectCompleteModelAnswer(card.modelAnswer);
    }
  });

  it('covers every mini mock speaking and writing task', () => {
    for (const mock of mockTests) {
      expectCompleteModelAnswer(mock.speakingTask.modelAnswer);
      expectCompleteModelAnswer(mock.writingTask.modelAnswer);
    }
  });
});
