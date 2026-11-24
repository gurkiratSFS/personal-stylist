export function canAccessProfile(viewerId: string, profileId: string) {
  return viewerId === profileId;
}
