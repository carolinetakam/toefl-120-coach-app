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
    process.env.NEXT_PUBLIC_CONVEX_URL = 'https://pleasant-quail-129.convex.cloud';
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = '';

    expect(getProductionReadiness()).toEqual({
      hasLiveClerkPublishableKey: false,
      hasLiveClerkSecretKey: false,
      hasSupportEmail: false,
      hasConvexUrl: true,
    });
  });

  it('passes when production launch values are present', () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_live_example';
    process.env.CLERK_SECRET_KEY = 'sk_live_example';
    process.env.NEXT_PUBLIC_CONVEX_URL = 'https://example.convex.cloud';
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = 'support@example.com';

    expect(Object.values(getProductionReadiness()).every(Boolean)).toBe(true);
  });
});
