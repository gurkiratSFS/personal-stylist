"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import {
  completeOnboarding,
  skipOnboarding,
  type StyleActionState,
} from "@/app/style-profile/actions";
import { PhotoUploader } from "@/components/photos/photo-uploader";
import { OptionChips } from "@/components/style-profile/option-chips";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  BUDGET_BANDS,
  CLIMATES,
  COLOR_OPTIONS,
  FASHION_CATEGORIES,
  FIT_PREFERENCES,
  LIFESTYLES,
  PREFERRED_STYLES,
} from "@/lib/style-profile/options";
import { cn } from "@/lib/utils";

const initialState: StyleActionState = { error: null, message: null };

const STEPS = [
  {
    id: "categories",
    title: "What do you shop and wear?",
    description: "Pick the categories that match how you dress most days.",
  },
  {
    id: "styles",
    title: "Which styles feel like you?",
    description: "Choose a few directions. You can refine this later.",
  },
  {
    id: "context",
    title: "Budget, climate, and lifestyle",
    description: "These shape practical recommendations — not a judgment.",
  },
  {
    id: "colors-fit",
    title: "Colors and fit (optional)",
    description: "Skip if you prefer. Favorites help shopping and outfits later.",
  },
  {
    id: "photos",
    title: "Optional photos",
    description:
      "Private and deletable. Used later for grooming and fit context — never required.",
  },
  {
    id: "review",
    title: "Your Style DNA preview",
    description: "Based on your answers. You can edit every field on Profile.",
  },
] as const;

type WizardDefaults = {
  fashion_categories: string[];
  preferred_styles: string[];
  budget_band: string | null;
  climate: string | null;
  lifestyle: string | null;
  favorite_colors: string[];
  disliked_colors: string[];
  fit_preferences: string[];
  summary: string | null;
};

export function OnboardingWizard({ defaults }: { defaults: WizardDefaults }) {
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState(defaults.fashion_categories);
  const [styles, setStyles] = useState(defaults.preferred_styles);
  const [budget, setBudget] = useState(defaults.budget_band ? [defaults.budget_band] : []);
  const [climate, setClimate] = useState(defaults.climate ? [defaults.climate] : []);
  const [lifestyle, setLifestyle] = useState(
    defaults.lifestyle ? [defaults.lifestyle] : [],
  );
  const [favorites, setFavorites] = useState(defaults.favorite_colors);
  const [disliked, setDisliked] = useState(defaults.disliked_colors);
  const [fits, setFits] = useState(defaults.fit_preferences);
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);

  const progress = ((step + 1) / STEPS.length) * 100;
  const current = STEPS[step];
  const isPhotoStep = step === 4;

  const preview = useMemo(() => {
    const parts = [
      categories.length ? `Categories: ${categories.join(", ")}` : null,
      styles.length ? `Styles: ${styles.join(", ")}` : null,
      budget[0] ? `Budget: ${budget[0]}` : null,
      climate[0] ? `Climate: ${climate[0]}` : null,
      lifestyle[0] ? `Lifestyle: ${lifestyle[0]}` : null,
    ].filter(Boolean);
    return parts.join(" · ") || "Add a few preferences to preview your Style DNA.";
  }, [budget, categories, climate, lifestyle, styles]);

  function canContinue() {
    if (step === 0) return categories.length > 0;
    if (step === 1) return styles.length > 0;
    if (step === 2) return budget.length === 1 && climate.length === 1 && lifestyle.length === 1;
    return true;
  }

  const colorSwatches = Object.fromEntries(
    COLOR_OPTIONS.map((option) => [option.value, option.swatch]),
  );

  const hiddenFields = (
    <>
      <input type="hidden" name="fashion_categories" value={categories.join(",")} />
      <input type="hidden" name="preferred_styles" value={styles.join(",")} />
      <input type="hidden" name="budget_band" value={budget[0] ?? ""} />
      <input type="hidden" name="climate" value={climate[0] ?? ""} />
      <input type="hidden" name="lifestyle" value={lifestyle[0] ?? ""} />
      <input type="hidden" name="favorite_colors" value={favorites.join(",")} />
      <input type="hidden" name="disliked_colors" value={disliked.join(",")} />
      <input type="hidden" name="fit_preferences" value={fits.join(",")} />
    </>
  );

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex min-h-svh flex-col overflow-y-auto px-5 py-8 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between gap-4">
          <Link href="/home" className="font-display text-xl tracking-tight">
            Personal Stylist
          </Link>
          <form action={skipOnboarding}>
            <Button type="submit" variant="ghost" size="sm">
              Skip for now
            </Button>
          </form>
        </div>

        <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-mist">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-xs tracking-[0.18em] text-muted-foreground uppercase">
          Step {step + 1} of {STEPS.length}
        </p>

        <div className="mt-6 max-w-xl space-y-3">
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            {current.title}
          </h1>
          <p className="text-muted-foreground">{current.description}</p>
        </div>

        {/* Photo step stays outside the style form to avoid nested <form> tags. */}
        {isPhotoStep ? (
          <div className="mt-8 flex max-w-xl flex-1 flex-col">
            <div className="flex-1 space-y-6">
              <PhotoUploader compact />
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((value) => Math.max(0, value - 1))}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))}
              >
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <form action={formAction} className="mt-8 flex max-w-xl flex-1 flex-col">
            {hiddenFields}

            <div className="flex-1 space-y-6">
              {step === 0 ? (
                <OptionChips
                  name="fashion_categories_ui"
                  options={FASHION_CATEGORIES}
                  selected={categories}
                  onChange={setCategories}
                />
              ) : null}

              {step === 1 ? (
                <OptionChips
                  name="preferred_styles_ui"
                  options={PREFERRED_STYLES}
                  selected={styles}
                  onChange={setStyles}
                />
              ) : null}

              {step === 2 ? (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label>Budget</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {BUDGET_BANDS.map((option) => {
                        const active = budget[0] === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setBudget([option.value])}
                            className={cn(
                              "rounded-2xl border p-4 text-left transition-colors",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card hover:border-accent/40",
                            )}
                          >
                            <p className="font-display text-lg">{option.label}</p>
                            <p
                              className={cn(
                                "mt-1 text-sm",
                                active ? "text-primary-foreground/75" : "text-muted-foreground",
                              )}
                            >
                              {option.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Climate</Label>
                    <OptionChips
                      name="climate_ui"
                      options={CLIMATES}
                      selected={climate}
                      onChange={setClimate}
                      multiple={false}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Lifestyle</Label>
                    <OptionChips
                      name="lifestyle_ui"
                      options={LIFESTYLES}
                      selected={lifestyle}
                      onChange={setLifestyle}
                      multiple={false}
                    />
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label>Favorite colors</Label>
                    <OptionChips
                      name="favorite_colors_ui"
                      options={COLOR_OPTIONS}
                      selected={favorites}
                      onChange={setFavorites}
                      swatches={colorSwatches}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Colors to avoid</Label>
                    <OptionChips
                      name="disliked_colors_ui"
                      options={COLOR_OPTIONS}
                      selected={disliked}
                      onChange={setDisliked}
                      swatches={colorSwatches}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Fit preferences</Label>
                    <OptionChips
                      name="fit_preferences_ui"
                      options={FIT_PREFERENCES}
                      selected={fits}
                      onChange={setFits}
                    />
                  </div>
                </div>
              ) : null}

              {step === 5 ? (
                <div className="space-y-4 rounded-[1.4rem] border border-border bg-card p-6">
                  <p className="text-xs tracking-[0.18em] text-accent uppercase">
                    Based on your answers
                  </p>
                  <p className="font-display text-2xl leading-snug">{preview}</p>
                  {defaults.summary ? (
                    <p className="text-sm text-muted-foreground">{defaults.summary}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Saving will create your editable Style DNA on Profile. No AI claims —
                      only what you chose.
                    </p>
                  )}
                </div>
              ) : null}

              {state.error ? (
                <p
                  className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {state.error}
                </p>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
              <Button
                type="button"
                variant="outline"
                disabled={step === 0}
                onClick={() => setStep((value) => Math.max(0, value - 1))}
              >
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  disabled={!canContinue()}
                  onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))}
                >
                  Continue
                </Button>
              ) : (
                <Button type="submit" disabled={pending || !canContinue()}>
                  {pending ? "Saving…" : "Save Style DNA"}
                </Button>
              )}
            </div>
          </form>
        )}
      </div>

      <aside className="relative hidden h-svh overflow-hidden lg:sticky lg:top-0 lg:block">
        <Image
          src="/images/auth-signup-visual.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="50vw"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/10" />
        <div className="absolute inset-x-0 bottom-0 space-y-3 p-10 text-white">
          <p className="text-xs tracking-[0.2em] text-white/70 uppercase">
            Personal Style DNA
          </p>
          <h2 className="max-w-md font-display text-3xl leading-tight">
            Short setup. Lasting personalization.
          </h2>
          <p className="max-w-md text-sm text-white/75">
            Essentials first. Photos and appearance stay optional — always editable, always yours.
          </p>
        </div>
      </aside>
    </div>
  );
}
