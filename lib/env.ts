import { productionLaunchConfig } from '@/lib/launch';

export interface ProductionReadinessChecks {
  hasLiveClerkPublishableKey: boolean;
  hasLiveClerkSecretKey: boolean;
  hasClerkJwtIssuerDomain: boolean;
  hasSupportEmail: boolean;
  hasConvexUrl: boolean;
}

export function getProductionReadiness(): ProductionReadinessChecks {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
  const secretKey = process.env.CLERK_SECRET_KEY ?? '';
  const clerkJwtIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN ?? '';
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? '';
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? '';

  return {
    hasLiveClerkPublishableKey: publishableKey.startsWith('pk_live_'),
    hasLiveClerkSecretKey: secretKey.startsWith('sk_live_'),
    hasClerkJwtIssuerDomain: clerkJwtIssuerDomain === productionLaunchConfig.clerkFrontendApi,
    hasSupportEmail: supportEmail === productionLaunchConfig.supportEmail,
    hasConvexUrl: convexUrl === productionLaunchConfig.convexUrl,
  };
}

export function assertProductionEnvironment() {
  if (process.env.REQUIRE_PRODUCTION_ENV !== 'true') return;
  const readiness = getProductionReadiness();
  const failures = Object.entries(readiness)
    .filter(([, passed]) => !passed)
    .map(([key]) => key);

  if (failures.length) {
    throw new Error(`Production environment is not ready: ${failures.join(', ')}`);
  }
}
