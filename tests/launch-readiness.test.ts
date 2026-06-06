import { describe, expect, it } from 'vitest';
import { buildLaunchReadinessAudit } from '@/lib/launch-readiness';

describe('launch readiness audit', () => {
  it('blocks beta onboarding when production env is missing', () => {
    const audit = buildLaunchReadinessAudit({
      hasLiveClerkPublishableKey: false,
      hasLiveClerkSecretKey: false,
      hasClerkJwtIssuerDomain: true,
      hasSupportEmail: true,
      hasConvexUrl: true,
    });

    expect(audit.ready).toBe(false);
    expect(audit.blockers).toContain('Clerk production publishable key');
    expect(audit.blockers).toContain('Clerk production secret key');
    expect(audit.checks.find((item) => item.key === 'clerk_jwt_issuer')?.status).toBe('pass');
    expect(audit.checks.find((item) => item.key === 'public_domain')?.status).toBe('pass');
    expect(audit.checks.find((item) => item.key === 'clerk_custom_domain')?.status).toBe('pass');
    expect(audit.checks.find((item) => item.key === 'three_day_beta_path')?.status).toBe('pass');
  });

  it('passes automated gates while keeping manual smoke checks visible', () => {
    const audit = buildLaunchReadinessAudit({
      hasLiveClerkPublishableKey: true,
      hasLiveClerkSecretKey: true,
      hasClerkJwtIssuerDomain: true,
      hasSupportEmail: true,
      hasConvexUrl: true,
    });

    expect(audit.ready).toBe(true);
    expect(audit.manualReviewRequired).toBe(true);
    expect(audit.checks.filter((item) => item.status === 'manual').map((item) => item.key)).toEqual([
      'signed_in_sync',
      'reset_export_smoke',
    ]);
    expect(audit.checks.find((item) => item.key === 'reset_export_smoke')?.detail).toMatch(/paste\/import backup/i);
  });
});
