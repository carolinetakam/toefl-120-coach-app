import { describe, expect, it } from 'vitest';
import { betaCohortSize, betaOnboardingSteps, betaSafetyChecks, koreaBetaQualification } from '@/lib/launch';

describe('launch onboarding content', () => {
  it('gives beta learners a complete first-session path', () => {
    expect(betaOnboardingSteps.map((step) => step.title)).toEqual([
      'Create your account',
      'Set your TOEFL target',
      'Finish the strategy diagnostic',
      'Submit one mini mock',
      'Return for four daily plans',
    ]);
    expect(betaCohortSize).toContain('5 Korean learners only');
  });

  it('keeps safety expectations explicit before onboarding users', () => {
    expect(betaSafetyChecks.join(' ')).toContain('not official TOEFL scores');
    expect(betaSafetyChecks.join(' ')).toContain('not affiliated');
    expect(betaSafetyChecks.join(' ')).toContain('export or delete progress');
    expect(koreaBetaQualification.length).toBeGreaterThanOrEqual(4);
  });
});
