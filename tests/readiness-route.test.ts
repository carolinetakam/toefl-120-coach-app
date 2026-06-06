import { afterEach, describe, expect, it } from 'vitest';
import { GET } from '@/app/api/readiness/route';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

function setProductionEnv(overrides: Record<string, string> = {}) {
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_live_example';
  process.env.CLERK_SECRET_KEY = 'sk_live_example';
  process.env.CLERK_JWT_ISSUER_DOMAIN = 'https://clerk.score120coach.com';
  process.env.NEXT_PUBLIC_CONVEX_URL = 'https://brainy-chicken-240.convex.cloud';
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL = 'support@score120coach.com';
  Object.assign(process.env, overrides);
}

describe('/api/readiness', () => {
  it('returns 503 with concrete blockers when production auth keys are not live', async () => {
    setProductionEnv({
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_example',
      CLERK_SECRET_KEY: 'sk_test_example',
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(body.ready).toBe(false);
    expect(body.checks).toMatchObject({
      hasLiveClerkPublishableKey: false,
      hasLiveClerkSecretKey: false,
      hasClerkJwtIssuerDomain: true,
      hasConvexUrl: true,
      hasSupportEmail: true,
    });
    expect(body.audit.blockers).toContain('Clerk production publishable key');
    expect(body.audit.checks.find((item: { key: string }) => item.key === 'public_domain')?.status).toBe('pass');
  });

  it('returns 200 only when every automated production launch check passes', async () => {
    setProductionEnv();

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ready).toBe(true);
    expect(Object.values(body.checks).every(Boolean)).toBe(true);
    expect(body.audit.manualReviewRequired).toBe(true);
  });
});
