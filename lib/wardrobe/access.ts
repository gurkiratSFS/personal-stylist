export function canAccessWardrobeItem(viewerId: string, ownerId: string) {
  return viewerId === ownerId;
}

export function canAccessCombination(viewerId: string, ownerId: string) {
  return viewerId === ownerId;
}

export function canAccessWardrobeJob(viewerId: string, ownerId: string) {
  return viewerId === ownerId;
}

export function isOwnedWardrobePath(userId: string, storagePath: string) {
  return storagePath.startsWith(`${userId}/`);
}

/** Ensure every item id belongs to the allowed set (same owner catalog). */
export function assertOwnedItemIds(
  allowedIds: ReadonlySet<string>,
  itemIds: readonly string[],
) {
  for (const id of itemIds) {
    if (!allowedIds.has(id)) {
      return false;
    }
  }
  return true;
}
