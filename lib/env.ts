export function getProductionReadiness() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
  const secretKey = process.env.CLERK_SECRET_KEY ?? '';
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? '';

  return {
    hasLiveClerkPublishableKey: publishableKey.startsWith('pk_live_'),
    hasLiveClerkSecretKey: secretKey.startsWith('sk_live_'),
    hasSupportEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail),
    hasConvexUrl: Boolean(process.env.NEXT_PUBLIC_CONVEX_URL),
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
