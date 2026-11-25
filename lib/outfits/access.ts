export function canAccessOutfit(viewerId: string, ownerId: string) {
  return viewerId === ownerId;
}

export function canAccessAnalysis(viewerId: string, ownerId: string) {
  return viewerId === ownerId;
}

export function canAccessJob(viewerId: string, ownerId: string) {
  return viewerId === ownerId;
}

export function canAccessSavedLook(viewerId: string, ownerId: string) {
  return viewerId === ownerId;
}

export function isOwnedOutfitPath(userId: string, storagePath: string) {
  return storagePath.startsWith(`${userId}/`);
}
