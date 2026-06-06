import { afterEach, describe, expect, it } from 'vitest';
import { getProductionReadiness } from '@/lib/env';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('getProductionReadiness', () => {
  it('requires live Clerk keys, Convex URL, and support email', () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_example';
    process.env.CLERK_SECRET_KEY = 'sk_test_example';
    process.env.CLERK_JWT_ISSUER_DOMAIN = 'https://clerk.example.com';
    process.env.NEXT_PUBLIC_CONVEX_URL = 'https://pleasant-quail-129.convex.cloud';
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = '';

    expect(getProductionReadiness()).toEqual({
      hasLiveClerkPublishableKey: false,
      hasLiveClerkSecretKey: false,
      hasClerkJwtIssuerDomain: false,
      hasSupportEmail: false,
      hasConvexUrl: false,
    });
  });

  it('passes when production launch values are present', () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_live_example';
    process.env.CLERK_SECRET_KEY = 'sk_live_example';
    process.env.CLERK_JWT_ISSUER_DOMAIN = 'https://clerk.score120coach.com';
    process.env.NEXT_PUBLIC_CONVEX_URL = 'https://brainy-chicken-240.convex.cloud';
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = 'support@score120coach.com';

    expect(Object.values(getProductionReadiness()).every(Boolean)).toBe(true);
  });
});
