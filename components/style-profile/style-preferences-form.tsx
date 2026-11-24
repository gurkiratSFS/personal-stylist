"use client";

import { useActionState, useState } from "react";

import {
  saveStylePreferences,
  type StyleActionState,
} from "@/app/style-profile/actions";
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

const initialState: StyleActionState = { error: null, message: null };

export function StylePreferencesForm({
  defaults,
}: {
  defaults: {
    fashion_categories: string[];
    preferred_styles: string[];
    budget_band: string | null;
    climate: string | null;
    lifestyle: string | null;
    favorite_colors: string[];
    disliked_colors: string[];
    fit_preferences: string[];
  };
}) {
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
  const [state, formAction, pending] = useActionState(saveStylePreferences, initialState);
  const swatches = Object.fromEntries(
    COLOR_OPTIONS.map((option) => [option.value, option.swatch]),
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="fashion_categories" value={categories.join(",")} />
      <input type="hidden" name="preferred_styles" value={styles.join(",")} />
      <input type="hidden" name="budget_band" value={budget[0] ?? ""} />
      <input type="hidden" name="climate" value={climate[0] ?? ""} />
      <input type="hidden" name="lifestyle" value={lifestyle[0] ?? ""} />
      <input type="hidden" name="favorite_colors" value={favorites.join(",")} />
      <input type="hidden" name="disliked_colors" value={disliked.join(",")} />
      <input type="hidden" name="fit_preferences" value={fits.join(",")} />

      <div className="space-y-3">
        <Label>Fashion categories</Label>
        <OptionChips options={FASHION_CATEGORIES} name="c" selected={categories} onChange={setCategories} />
      </div>
      <div className="space-y-3">
        <Label>Preferred styles</Label>
        <OptionChips options={PREFERRED_STYLES} name="s" selected={styles} onChange={setStyles} />
      </div>
      <div className="space-y-3">
        <Label>Budget</Label>
        <OptionChips options={BUDGET_BANDS} name="b" selected={budget} onChange={setBudget} multiple={false} />
      </div>
      <div className="space-y-3">
        <Label>Climate</Label>
        <OptionChips options={CLIMATES} name="cl" selected={climate} onChange={setClimate} multiple={false} />
      </div>
      <div className="space-y-3">
        <Label>Lifestyle</Label>
        <OptionChips options={LIFESTYLES} name="l" selected={lifestyle} onChange={setLifestyle} multiple={false} />
      </div>
      <div className="space-y-3">
        <Label>Favorite colors</Label>
        <OptionChips options={COLOR_OPTIONS} name="f" selected={favorites} onChange={setFavorites} swatches={swatches} />
      </div>
      <div className="space-y-3">
        <Label>Colors to avoid</Label>
        <OptionChips options={COLOR_OPTIONS} name="d" selected={disliked} onChange={setDisliked} swatches={swatches} />
      </div>
      <div className="space-y-3">
        <Label>Fit preferences</Label>
        <OptionChips options={FIT_PREFERENCES} name="fit" selected={fits} onChange={setFits} />
      </div>

      {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-muted-foreground" role="status">{state.message}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save style preferences"}
      </Button>
    </form>
  );
}
