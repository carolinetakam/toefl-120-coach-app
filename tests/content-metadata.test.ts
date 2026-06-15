import { describe, expect, it } from 'vitest';
import { getMockQuestionMetadata, getMockTestMetadata, getPracticeCardMetadata } from '@/lib/content-metadata';
import { mockTests } from '@/lib/mock-tests';
import { practiceCards } from '@/lib/seed';

describe('content metadata registry', () => {
  it('tags every practice card as approved seed content with a strategy cue and repair rule', () => {
    const cards = Object.values(practiceCards).flat();

    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      const metadata = getPracticeCardMetadata(card);

      expect(metadata.contentId).toBe(card.id);
      expect(metadata.section).toBe(card.section);
      expect(metadata.sourceType).toBe('approved_seed');
      expect(metadata.reviewStatus).toBe('approved');
      expect(metadata.strategyCardId.length).toBeGreaterThan(0);
      expect(metadata.cue.length).toBeGreaterThan(12);
      expect(metadata.repairRule.length).toBeGreaterThan(12);
      expect(metadata.traps.length).toBeGreaterThan(0);
      expect(metadata.responseMode).toBe(card.responseMode ?? 'learner_answer');
    }
  });

  it('keeps mock questions cue-free during answering but ready for review metadata', () => {
    const questions = mockTests.flatMap((test) => test.questions);

    expect(questions.length).toBeGreaterThan(0);

    for (const question of questions) {
      const metadata = getMockQuestionMetadata(question);

      expect(metadata.contentId).toBe(question.id);
      expect(metadata.section).toBe(question.section);
      expect(metadata.sourceType).toBe('approved_seed');
      expect(metadata.strategyCardId.length).toBeGreaterThan(0);
    }
  });

  it('tags mini mockups as assembled approved seed content', () => {
    for (const test of mockTests) {
      const metadata = getMockTestMetadata(test.id);

      expect(metadata?.contentId).toBe(test.id);
      expect(metadata?.taskType).toBe('mini_mockup');
      expect(metadata?.reviewStatus).toBe('approved');
      expect(metadata?.timingSeconds).toBe(test.minutes * 60);
      expect(metadata?.responseMode).toBe('learner_answer');
      expect(metadata?.sourceMaterialCompleteness).toBe('complete');
    }
  });

  it('labels summary-only and template-only support content in the model layer', () => {
    const summaryCard = practiceCards.speaking.find((card) => card.id === 'pr-s-4');
    const templateCard = practiceCards.speaking.find((card) => card.id === 'pr-s-7');
    const summaryQuestion = mockTests.flatMap((test) => test.questions).find((question) => question.subskill === 'summary');

    expect(summaryCard?.sourceMaterialCompleteness).toBe('summary_only');
    expect(summaryCard?.materials?.lecture).toMatch(/professor explains/i);
    expect(templateCard?.responseMode).toBe('template_only');
    expect(templateCard?.sourceMaterialCompleteness).toBe('template_only');

    expect(summaryQuestion).toBeDefined();
    expect(getMockQuestionMetadata(summaryQuestion!).taskType).toBe('summary_only_reading_question');
    expect(getMockQuestionMetadata(summaryQuestion!).sourceMaterialCompleteness).toBe('summary_only');
  });

  it('fails loudly when practice content is missing approved metadata instead of using a fallback', () => {
    const unknownCard = {
      ...Object.values(practiceCards)[0][0],
      id: 'unknown-practice-card',
      subskill: 'unapproved generated subskill',
    };

    expect(() => getPracticeCardMetadata(unknownCard)).toThrow(/approved metadata/i);
  });

  it('fails loudly when a mock question is missing approved metadata instead of using section defaults', () => {
    const unknownQuestion = {
      ...mockTests[0].questions[0],
      id: 'unknown-mock-question',
      subskill: 'unapproved generated subskill',
    };

    expect(() => getMockQuestionMetadata(unknownQuestion)).toThrow(/approved metadata/i);
  });

  it('fails loudly when a mini mock is missing approved metadata instead of using the first mock', () => {
    expect(() => getMockTestMetadata('unknown-mini-mock')).toThrow(/approved metadata/i);
  });
});
