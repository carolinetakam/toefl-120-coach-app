import { describe, expect, it } from 'vitest';
import { betaCohortSize, betaOnboardingSteps, betaSafetyChecks, koreaBetaQualification, productionLaunchConfig } from '@/lib/launch';

describe('launch onboarding content', () => {
  it('gives beta learners a complete first-session path', () => {
    expect(betaOnboardingSteps.map((step) => step.title)).toEqual([
      'Create your account',
      'Set your TOEFL target',
      'Finish the strategy diagnostic',
      'Submit one mini mock',
      'Complete the 3-day sprint',
    ]);
    expect(betaCohortSize).toContain('5 Korean learners only');
    expect(betaOnboardingSteps.at(-1)?.detail).toContain('5-day maximum');
  });

  it('keeps safety expectations explicit before onboarding users', () => {
    expect(betaSafetyChecks.join(' ')).toContain('not official TOEFL scores');
    expect(betaSafetyChecks.join(' ')).toContain('not affiliated');
    expect(betaSafetyChecks.join(' ')).toContain('export or delete progress');
    expect(koreaBetaQualification.length).toBeGreaterThanOrEqual(4);
  });

  it('tracks the production domain and support routing in code', () => {
    expect(productionLaunchConfig.publicUrl).toBe('https://score120coach.com');
    expect(productionLaunchConfig.wwwDomain).toBe('www.score120coach.com');
    expect(productionLaunchConfig.host).toContain('Vercel');
    expect(productionLaunchConfig.convexUrl).toBe('https://brainy-chicken-240.convex.cloud');
    expect(productionLaunchConfig.clerkFrontendApi).toBe('https://clerk.score120coach.com');
    expect(productionLaunchConfig.supportEmail).toBe('support@score120coach.com');
  });
});
