import { getProductionReadiness, type ProductionReadinessChecks } from '@/lib/env';
import { betaOnboardingSteps, betaSafetyChecks, koreaBetaQualification, productionLaunchConfig } from '@/lib/launch';

export type LaunchReadinessStatus = 'pass' | 'fail' | 'manual';
export type LaunchSmokeCheckKey = 'signed_in_sync' | 'reset_export_smoke';

export interface LaunchReadinessCheck {
  key: string;
  label: string;
  status: LaunchReadinessStatus;
  blocking: boolean;
  detail: string;
}

export interface LaunchReadinessAudit {
  ready: boolean;
  manualReviewRequired: boolean;
  checks: LaunchReadinessCheck[];
  blockers: string[];
}

export interface LaunchSmokeCheckState {
  done: boolean;
  checkedAt?: string;
}

export type LaunchSmokeChecks = Record<LaunchSmokeCheckKey, LaunchSmokeCheckState>;

export const launchSmokeCheckDefinitions: Array<{ key: LaunchSmokeCheckKey; label: string; detail: string }> = [
  {
    key: 'signed_in_sync',
    label: 'Signed-in sync smoke test',
    detail: 'Sign in, complete diagnostic, save a timed mini mock, reload, and confirm synced state restores.',
  },
  {
    key: 'reset_export_smoke',
    label: 'Reset/export smoke test',
    detail: 'Show backup JSON or export backup, preview readiness report, reset progress, paste/import backup, and confirm progress restores.',
  },
];

export const defaultLaunchSmokeChecks: LaunchSmokeChecks = {
  signed_in_sync: { done: false },
  reset_export_smoke: { done: false },
};

function check(key: string, label: string, passed: boolean, detail: string): LaunchReadinessCheck {
  return {
    key,
    label,
    status: passed ? 'pass' : 'fail',
    blocking: !passed,
    detail,
  };
}

function manual(key: string, label: string, detail: string): LaunchReadinessCheck {
  return {
    key,
    label,
    status: 'manual',
    blocking: false,
    detail,
  };
}

export function buildLaunchReadinessAudit(readiness: ProductionReadinessChecks = getProductionReadiness()): LaunchReadinessAudit {
  const betaPathIsThreeDay = betaOnboardingSteps.some((step) => /3-day sprint/i.test(`${step.title} ${step.detail}`));
  const safetyLanguageIsExplicit = betaSafetyChecks.join(' ').toLowerCase().includes('not official toefl scores');
  const qualificationHasUrgency = koreaBetaQualification.some((item) => /3-5 days/i.test(item));
  const publicDomainConfigured = productionLaunchConfig.publicDomain === 'score120coach.com' && productionLaunchConfig.publicUrl === 'https://score120coach.com';
  const clerkCustomDomainConfigured = productionLaunchConfig.clerkFrontendApi === 'https://clerk.score120coach.com';

  const checks: LaunchReadinessCheck[] = [
    check('clerk_publishable', 'Clerk production publishable key', readiness.hasLiveClerkPublishableKey, 'Must start with pk_live_ before external beta users sign in.'),
    check('clerk_secret', 'Clerk production secret key', readiness.hasLiveClerkSecretKey, 'Must start with sk_live_ and stay server-only.'),
    check('clerk_jwt_issuer', 'Clerk JWT issuer domain', readiness.hasClerkJwtIssuerDomain, 'CLERK_JWT_ISSUER_DOMAIN must be https://clerk.score120coach.com for Convex auth.'),
    check('convex_url', 'Convex production URL', readiness.hasConvexUrl, 'NEXT_PUBLIC_CONVEX_URL must be https://brainy-chicken-240.convex.cloud.'),
    check('support_email', 'Production support email', readiness.hasSupportEmail, 'NEXT_PUBLIC_SUPPORT_EMAIL must be support@score120coach.com.'),
    check('public_domain', 'Public domain configured', publicDomainConfigured, 'Production should use score120coach.com on the Vercel project.'),
    check('clerk_custom_domain', 'Clerk custom domain configured', clerkCustomDomainConfigured, 'Clerk frontend API should use clerk.score120coach.com.'),
    check('three_day_beta_path', '3-day beta onboarding path', betaPathIsThreeDay, 'Beta copy must match the 3-day emergency / 5-day maximum strategy.'),
    check('safe_scoring_language', 'Safe scoring language', safetyLanguageIsExplicit, 'Beta copy must state practice signals are not official TOEFL scores.'),
    check('korea_urgency_fit', 'Korea beta urgency fit', qualificationHasUrgency, 'Korea beta qualification should select learners who can practice in the next 3-5 days.'),
    ...launchSmokeCheckDefinitions.map((item) => manual(item.key, item.label, item.detail)),
  ];

  const blockers = checks.filter((item) => item.blocking).map((item) => item.label);

  return {
    ready: blockers.length === 0,
    manualReviewRequired: checks.some((item) => item.status === 'manual'),
    checks,
    blockers,
  };
}

export function smokeChecksComplete(smokeChecks: LaunchSmokeChecks) {
  return launchSmokeCheckDefinitions.every((item) => smokeChecks[item.key]?.done);
}

export function buildFounderLaunchGate(audit: LaunchReadinessAudit | null, smokeChecks: LaunchSmokeChecks) {
  const envReady = Boolean(audit?.ready);
  const manualReady = smokeChecksComplete(smokeChecks);
  return {
    ready: envReady && manualReady,
    envReady,
    manualReady,
    label: !audit ? 'Checking launch readiness' : envReady && manualReady ? 'Ready to onboard beta users' : envReady ? 'Manual smoke tests pending' : 'Beta onboarding is blocked',
  };
}
