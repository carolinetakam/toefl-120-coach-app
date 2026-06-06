import { describe, expect, it } from 'vitest';
import { evaluateSpeakingAttempt, evaluateWritingAttempt } from '@/lib/scoring';
import { practiceCards } from '@/lib/seed';

describe('skill scoring', () => {
  it('rewards speaking evidence with structure, source detail, audio, and clean finish', () => {
    const card = practiceCards.speaking[0];
    const weak = evaluateSpeakingAttempt(card, 2, 'I pause and my intro is too long.', false);
    const strong = evaluateSpeakingAttempt(
      card,
      5,
      'First, I state the campus change clearly. For example, I explain the student reason and source detail. I finish with a complete final sentence.',
      true,
    );

    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.band).toBe('ready');
    expect(weak.repairs.join(' ')).toMatch(/Record audio|source|fixed opening/i);
    expect(strong.proofChecks.every((check) => check.passed)).toBe(true);
    expect(weak.proofChecks.find((check) => check.label === 'Recorded audio')?.passed).toBe(false);
  });

  it('rewards writing with stance, support, task coverage, and revision evidence', () => {
    const card = practiceCards.writing.find((item) => item.subskill === 'discussion response quality') ?? practiceCards.writing[0];
    const weak = evaluateWritingAttempt(card, 'Small class is good. Small class is good.', '');
    const strong = evaluateWritingAttempt(
      card,
      'I believe smaller discussion classes are worth the cost because students participate more actively and receive feedback that is difficult to get in a large lecture. In a large class, many students stay quiet when they are confused because asking a question in front of one hundred classmates feels uncomfortable. For example, a student in biology can ask a specific question in a small group, compare answers with classmates, and get correction before an exam. This makes the extra cost reasonable because the class produces stronger learning, not just more attention. It also gives the professor better evidence about which ideas students still misunderstand. For that reason, a discussion class is a practical investment when the course requires analysis and communication.',
      'I clarified the example consequence, made the position explicit in the first sentence, and connected the biology example back to discussion-class learning and professor feedback.',
    );

    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.strengths.length).toBeGreaterThan(weak.strengths.length);
    expect(weak.repairs.join(' ')).toMatch(/target range|position|example|revision/i);
    expect(strong.proofChecks.every((check) => check.passed)).toBe(true);
    expect(weak.proofChecks.find((check) => check.label === 'Revision evidence')?.passed).toBe(false);
  });

  it('flags repeated grammar patterns as repair work', () => {
    const card = practiceCards.writing[0];
    const evaluation = evaluateWritingAttempt(
      card,
      'I think class is useful because many student can ask. The teacher know every student and student speak more. For example, people is more confident when they has support.',
      'I added more words but many student still appears.',
    );

    expect(evaluation.repairs.join(' ')).toMatch(/grammar/i);
  });

  it('does not mark below-target writing as ready even with good structure', () => {
    const card = practiceCards.writing.find((item) => item.subskill === 'integrated writing') ?? practiceCards.writing[0];
    const evaluation = evaluateWritingAttempt(
      card,
      'The reading claims urban farming can help cities, but the lecture challenges this view. First, the professor explains that yields are limited, so rooftop farms cannot replace normal food systems. Second, setup costs and maintenance make these projects less efficient than supporters expect. Third, education is useful, but it does not solve food supply problems. Therefore, the lecture weakens the reading by showing that urban farming is helpful but incomplete.',
      'Revision: I connected each reading claim to a lecture challenge and removed personal opinion.',
    );

    expect(evaluation.metrics.words).toBeLessThan(120);
    expect(evaluation.band).toBe('developing');
    expect(evaluation.repairs.join(' ')).toMatch(/target range/i);
    expect(evaluation.proofChecks.find((check) => check.label === 'Target length')?.passed).toBe(false);
  });
});
