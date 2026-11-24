"use client";

import { useActionState, useState } from "react";

import { saveAppearance, type StyleActionState } from "@/app/style-profile/actions";
import { OptionChips } from "@/components/style-profile/option-chips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AGE_RANGES,
  GENDER_PRESENTATIONS,
  GROOMING_PREFERENCES,
  HAIR_TYPES,
  HAIRSTYLE_PREFERENCES,
  UNDERTONE_PREFERENCES,
} from "@/lib/style-profile/options";

const initialState: StyleActionState = { error: null, message: null };

const selectClassName =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function AppearanceForm({
  defaults,
}: {
  defaults: {
    age_range: string | null;
    gender_presentation: string | null;
    height_cm: number | null;
    proportion_notes: string | null;
    hair_type: string | null;
    preferred_hairstyles: string[];
    grooming_preferences: string[];
    skin_undertone_preference: string | null;
  };
}) {
  const [hairstyles, setHairstyles] = useState(defaults.preferred_hairstyles);
  const [grooming, setGrooming] = useState(defaults.grooming_preferences);
  const [state, formAction, pending] = useActionState(saveAppearance, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Everything here is optional. Never required to use Personal Stylist.
      </p>
      <input type="hidden" name="preferred_hairstyles" value={hairstyles.join(",")} />
      <input type="hidden" name="grooming_preferences" value={grooming.join(",")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="age_range">Age range</Label>
          <select
            id="age_range"
            name="age_range"
            defaultValue={defaults.age_range ?? ""}
            className={selectClassName}
          >
            <option value="">Prefer not to say</option>
            {AGE_RANGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender_presentation">Shopping / presentation</Label>
          <select
            id="gender_presentation"
            name="gender_presentation"
            defaultValue={defaults.gender_presentation ?? ""}
            className={selectClassName}
          >
            <option value="">Prefer not to say</option>
            {GENDER_PRESENTATIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="height_cm">Height (cm)</Label>
          <Input
            id="height_cm"
            name="height_cm"
            type="number"
            min={100}
            max={250}
            defaultValue={defaults.height_cm ?? ""}
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hair_type">Hair type</Label>
          <select
            id="hair_type"
            name="hair_type"
            defaultValue={defaults.hair_type ?? ""}
            className={selectClassName}
          >
            <option value="">Not set</option>
            {HAIR_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="skin_undertone_preference">Undertone preference</Label>
          <select
            id="skin_undertone_preference"
            name="skin_undertone_preference"
            defaultValue={defaults.skin_undertone_preference ?? ""}
            className={selectClassName}
          >
            <option value="">Not set</option>
            {UNDERTONE_PREFERENCES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Your preference only — not an AI skin classification.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proportion_notes">Proportion notes</Label>
        <textarea
          id="proportion_notes"
          name="proportion_notes"
          rows={2}
          defaultValue={defaults.proportion_notes ?? ""}
          className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-3">
        <Label>Preferred hairstyles</Label>
        <OptionChips
          name="hairstyles_ui"
          options={HAIRSTYLE_PREFERENCES}
          selected={hairstyles}
          onChange={setHairstyles}
        />
      </div>
      <div className="space-y-3">
        <Label>Grooming preferences</Label>
        <OptionChips
          name="grooming_ui"
          options={GROOMING_PREFERENCES}
          selected={grooming}
          onChange={setGrooming}
        />
      </div>

      {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-muted-foreground" role="status">{state.message}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save appearance"}
      </Button>
    </form>
  );
}
