import Link from "next/link";
import { connection } from "next/server";

import { PhotoUploader } from "@/components/photos/photo-uploader";
import { ProfileForm } from "@/components/profile-form";
import { AppearanceForm } from "@/components/style-profile/appearance-form";
import {
  CompletenessMeter,
  computeStyleCompleteness,
} from "@/components/style-profile/completeness-meter";
import { DnaForm } from "@/components/style-profile/dna-form";
import { StylePreferencesForm } from "@/components/style-profile/style-preferences-form";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { listUserPhotosWithUrls } from "@/lib/photos/service";
import { getProfileForUser } from "@/lib/profile/service";
import {
  getAppearanceProfileForUser,
  getStyleProfileForUser,
  isOnboardingEssentialsComplete,
} from "@/lib/style-profile/service";
import { cn } from "@/lib/utils";

export const metadata = { title: "Profile" };
export const instant = false;

export default async function ProfilePage() {
  await connection();
  const user = await requireUser();
  const [profile, style, appearance, photos] = await Promise.all([
    getProfileForUser(user.id),
    getStyleProfileForUser(user.id),
    getAppearanceProfileForUser(user.id),
    listUserPhotosWithUrls(user.id),
  ]);

  const essentialsComplete = isOnboardingEssentialsComplete(style);
  const completeness = computeStyleCompleteness({
    essentialsComplete,
    hasColors: Boolean(
      (style?.favorite_colors.length ?? 0) + (style?.disliked_colors.length ?? 0),
    ),
    hasFit: Boolean(style?.fit_preferences.length),
    hasDnaSummary: Boolean(style?.summary?.trim()),
    hasAppearance: Boolean(
      appearance?.hair_type ||
        appearance?.age_range ||
        appearance?.grooming_preferences.length ||
        appearance?.preferred_hairstyles.length,
    ),
    hasPhotos: photos.length > 0,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header className="space-y-4">
        <p className="text-xs tracking-[0.2em] text-accent uppercase">Profile</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <h1 className="font-display text-4xl tracking-tight">Your style identity</h1>
            <p className="text-muted-foreground">
              Locale preferences, Style DNA, optional appearance context, and a private photo
              vault — all editable, never inventing AI judgments.
            </p>
          </div>
          {!essentialsComplete ? (
            <Link href="/onboarding" className={cn(buttonVariants())}>
              Resume onboarding
            </Link>
          ) : null}
        </div>
        <CompletenessMeter score={completeness} label="Profile completeness" />
      </header>

      <section
        id="style-dna"
        className="overflow-hidden rounded-[1.75rem] border border-border bg-ink text-primary-foreground"
      >
        <div className="space-y-4 px-6 py-8 sm:px-8">
          <p className="text-xs tracking-[0.18em] text-white/55 uppercase">
            Personal Style DNA
          </p>
          <h2 className="max-w-2xl font-display text-3xl tracking-tight">
            {style?.summary?.trim() ||
              "Complete essentials to seed your Style DNA from your answers."}
          </h2>
          <p className="max-w-2xl text-sm text-white/70">
            Based on your answers — not an AI attractiveness score. Edit the narrative fields
            below anytime.
          </p>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3 rounded-[1.4rem] border border-border bg-card p-6">
          <h2 className="font-display text-2xl">Account locale</h2>
          <p className="text-sm text-muted-foreground">
            Signed in as {user.email ?? "your account"}. Currency and region shape shopping later.
          </p>
          <ProfileForm
            defaults={{
              display_name: profile?.display_name ?? "",
              country: profile?.country ?? "IN",
              language: profile?.language ?? "en",
              currency: profile?.currency ?? "INR",
              timezone: profile?.timezone ?? "Asia/Kolkata",
            }}
          />
        </div>

        <div className="space-y-3 rounded-[1.4rem] border border-border bg-card p-6">
          <h2 className="font-display text-2xl">Style DNA notes</h2>
          <DnaForm
            defaults={{
              summary: style?.summary ?? null,
              goals: style?.goals ?? null,
              palette_notes: style?.palette_notes ?? null,
              fit_notes: style?.fit_notes ?? null,
              grooming_notes: style?.grooming_notes ?? null,
              shopping_notes: style?.shopping_notes ?? null,
            }}
          />
        </div>
      </section>

      <section className="rounded-[1.4rem] border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Style preferences</h2>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">
          Structured choices used by future outfit, shopping, and assistant modules.
        </p>
        <StylePreferencesForm
          defaults={{
            fashion_categories: style?.fashion_categories ?? [],
            preferred_styles: style?.preferred_styles ?? [],
            budget_band: style?.budget_band ?? null,
            climate: style?.climate ?? null,
            lifestyle: style?.lifestyle ?? null,
            favorite_colors: style?.favorite_colors ?? [],
            disliked_colors: style?.disliked_colors ?? [],
            fit_preferences: style?.fit_preferences ?? [],
          }}
        />
      </section>

      <section className="rounded-[1.4rem] border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Appearance (optional)</h2>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">
          Helps grooming and fit context. Never required to use the product.
        </p>
        <AppearanceForm
          defaults={{
            age_range: appearance?.age_range ?? null,
            gender_presentation: appearance?.gender_presentation ?? null,
            height_cm: appearance?.height_cm ?? null,
            proportion_notes: appearance?.proportion_notes ?? null,
            hair_type: appearance?.hair_type ?? null,
            preferred_hairstyles: appearance?.preferred_hairstyles ?? [],
            grooming_preferences: appearance?.grooming_preferences ?? [],
            skin_undertone_preference: appearance?.skin_undertone_preference ?? null,
          }}
        />
      </section>

      <section className="rounded-[1.4rem] border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Photo vault</h2>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">
          Private storage with signed access. Delete removes the file and the database record.
        </p>
        <PhotoUploader
          existing={photos.map((photo) => ({
            id: photo.id,
            photo_type: photo.photo_type,
            signedUrl: photo.signedUrl,
          }))}
        />
      </section>
    </div>
  );
}
