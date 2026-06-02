import { describe, expect, it } from 'vitest';
import { buildRepairNote, getMockQuestionMetadata, getMockTestMetadata, getPracticeCardMetadata } from '@/lib/content-metadata';
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
      expect(buildRepairNote(metadata)).toContain(metadata.strategyCardId);
    }
  });

  it('tags mini mockups as assembled approved seed content', () => {
    for (const test of mockTests) {
      const metadata = getMockTestMetadata(test.id);

      expect(metadata?.contentId).toBe(test.id);
      expect(metadata?.taskType).toBe('mini_mockup');
      expect(metadata?.reviewStatus).toBe('approved');
      expect(metadata?.timingSeconds).toBe(test.minutes * 60);
    }
  });
});
