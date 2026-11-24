export function canAccessStyleProfile(viewerId: string, ownerId: string) {
  return viewerId === ownerId;
}

export function canAccessAppearanceProfile(viewerId: string, ownerId: string) {
  return viewerId === ownerId;
}

export function canAccessUserPhoto(viewerId: string, ownerId: string) {
  return viewerId === ownerId;
}

export function isOwnedStoragePath(userId: string, storagePath: string) {
  return storagePath.startsWith(`${userId}/`);
}
