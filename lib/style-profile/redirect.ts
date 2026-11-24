import {
  getStyleProfileForUser,
  isOnboardingEssentialsComplete,
} from "@/lib/style-profile/service";

export async function postAuthDestination(userId: string) {
  const style = await getStyleProfileForUser(userId);
  if (isOnboardingEssentialsComplete(style)) {
    return "/home";
  }
  return "/onboarding";
}
