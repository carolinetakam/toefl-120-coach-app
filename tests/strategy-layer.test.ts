import { describe, expect, it } from 'vitest';
import { getPracticeCardMetadata } from '@/lib/content-metadata';
import { practiceCards } from '@/lib/seed';
import { sectionPlaybooks } from '@/lib/sprint';

const expectedStrategyCards = [
  {
    section: 'reading' as const,
    id: 'pr-r-9',
    questionType: 'sentence_insertion',
    title: /sentence insertion/i,
  },
  {
    section: 'listening' as const,
    id: 'pr-l-9',
    questionType: 'campus_roles',
    title: /campus roles/i,
  },
  {
    section: 'speaking' as const,
    id: 'pr-s-7',
    questionType: 'integrated_speaking_template',
    title: /template reveal/i,
  },
  {
    section: 'writing' as const,
    id: 'pr-w-7',
    questionType: 'integrated_writing_outline',
    title: /outline builder/i,
  },
];

describe('Andrew guide strategy layer', () => {
  it('adds the four high-value transformed strategy cards without raw guide dumping', () => {
    for (const expected of expectedStrategyCards) {
      const card = practiceCards[expected.section].find((item) => item.id === expected.id);

      expect(card, `${expected.id} should exist`).toBeTruthy();
      expect(card?.title).toMatch(expected.title);
      expect(card?.prompt.length).toBeLessThan(900);
      expect(card?.explanation.length).toBeLessThan(500);

      const metadata = getPracticeCardMetadata(card!);
      expect(metadata.questionType).toBe(expected.questionType);
      expect(metadata.sourceType).toBe('approved_seed');
      expect(metadata.reviewStatus).toBe('approved');
      expect(metadata.cue).toMatch(/2026|classic|template|role|outline|pronoun|source/i);
      expect(metadata.repairRule.length).toBeGreaterThan(20);
    }
  });

  it('keeps the product in hybrid transition mode instead of pretending the old 120 framing is the only format', () => {
    const playbookText = Object.values(sectionPlaybooks)
      .map((playbook) => [playbook.testShape, playbook.winCondition, ...playbook.template].join(' '))
      .join(' ');

    expect(playbookText).toMatch(/120-style prep/i);
    expect(playbookText).toMatch(/2026 readiness/i);
    expect(playbookText).toMatch(/not an official score/i);
  });
});
