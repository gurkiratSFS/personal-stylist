import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { requireUser } from "@/lib/auth/session";
import { getStyleProfileForUser } from "@/lib/style-profile/service";

export const metadata = { title: "Style onboarding" };
export const instant = false;

export default async function OnboardingPage() {
  const user = await requireUser();
  const style = await getStyleProfileForUser(user.id);

  return (
    <OnboardingWizard
      defaults={{
        fashion_categories: style?.fashion_categories ?? [],
        preferred_styles: style?.preferred_styles ?? [],
        budget_band: style?.budget_band ?? null,
        climate: style?.climate ?? null,
        lifestyle: style?.lifestyle ?? null,
        favorite_colors: style?.favorite_colors ?? [],
        disliked_colors: style?.disliked_colors ?? [],
        fit_preferences: style?.fit_preferences ?? [],
        summary: style?.summary ?? null,
      }}
    />
  );
}
