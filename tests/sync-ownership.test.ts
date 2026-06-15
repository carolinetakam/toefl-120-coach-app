import { describe, expect, it } from 'vitest';
import { canPromoteLocalStateToCloud, localStateBelongsToAnotherUser } from '@/lib/sync-ownership';

describe('sync ownership safety', () => {
  it('allows first signed-in account to promote guest progress', () => {
    expect(canPromoteLocalStateToCloud(true, null, 'user_1')).toBe(true);
  });

  it('allows same account to keep promoting local progress', () => {
    expect(canPromoteLocalStateToCloud(true, 'user_1', 'user_1')).toBe(true);
  });

  it('blocks another signed-in account from inheriting previous account local progress', () => {
    expect(localStateBelongsToAnotherUser('user_1', 'user_2')).toBe(true);
    expect(canPromoteLocalStateToCloud(true, 'user_1', 'user_2')).toBe(false);
  });

  it('does not promote empty local state', () => {
    expect(canPromoteLocalStateToCloud(false, null, 'user_1')).toBe(false);
  });
});
