export const LOCAL_SYNC_OWNER_KEY = 'toefl-120-coach-sync-owner';

export function localStateBelongsToAnotherUser(localOwnerId: string | null | undefined, currentUserId: string | null | undefined) {
  return Boolean(localOwnerId && currentUserId && localOwnerId !== currentUserId);
}

export function canPromoteLocalStateToCloud(localHasProgress: boolean, localOwnerId: string | null | undefined, currentUserId: string | null | undefined) {
  if (!localHasProgress) return false;
  return !localStateBelongsToAnotherUser(localOwnerId, currentUserId);
}
