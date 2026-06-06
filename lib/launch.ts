export const betaCohortSize = 'First cohort: 5 Korean learners only';

export const productionLaunchConfig = {
  publicDomain: 'score120coach.com',
  publicUrl: 'https://score120coach.com',
  wwwDomain: 'www.score120coach.com',
  host: 'Vercel project toefl-120-coach',
  convexUrl: 'https://brainy-chicken-240.convex.cloud',
  clerkFrontendApi: 'https://clerk.score120coach.com',
  supportEmail: 'support@score120coach.com',
};

export const betaOnboardingSteps = [
  {
    title: 'Create your account',
    detail: 'Confirm your beta slot first, then use the same email for sign-in and support.',
  },
  {
    title: 'Set your TOEFL target',
    detail: 'Add score goal, test date, daily minutes, and confidence by section.',
  },
  {
    title: 'Finish the strategy diagnostic',
    detail: 'Answer the baseline questions before trusting any readiness trend.',
  },
  {
    title: 'Submit one mini mock',
    detail: 'Complete objective questions, listening notes, speaking checklist, and writing response.',
  },
  {
    title: 'Complete the 3-day sprint',
    detail: 'Use Today, Review, Practice, and Mock so the beta can measure improvement before the 5-day maximum window ends.',
  },
];

export const betaSafetyChecks = [
  'Practice signals are not official TOEFL scores.',
  'TOEFL 120 Coach is not affiliated with, endorsed by, or certified by ETS.',
  'Signed-in progress syncs through Clerk and Convex; guest progress stays on one device.',
  'Writing and speaking notes may include sensitive learner data, so users can export or delete progress.',
  'Support requests should include sign-in email, device/browser, expected result, actual result, and screenshot if useful.',
];

export const koreaBetaQualification = [
  'Preparing for TOEFL in the next 1-6 months',
  'Can practice at least three times in the next 3-5 days',
  'Will report confusing scoring, broken flows, and unclear daily plans',
  'Understands the product gives practice-readiness signals, not guaranteed outcomes',
];
