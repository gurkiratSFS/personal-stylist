"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  generateCombinationsAction,
  type WardrobeActionState,
} from "@/app/wardrobe/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  MAX_GENERATE_COUNT,
  MIN_ITEMS_FOR_GENERATE,
  WARDROBE_OCCASIONS,
} from "@/lib/wardrobe/options";

const initial: WardrobeActionState = { error: null, message: null };

export function GenerateCombinationsForm({
  readyCount,
  visionReady,
}: {
  readyCount: number;
  visionReady: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!visionReady) {
    return (
      <p className="text-sm text-muted-foreground">
        Outfit generation isn’t available right now. You can still build looks manually.
      </p>
    );
  }

  if (readyCount < MIN_ITEMS_FOR_GENERATE) {
    return (
      <p className="text-sm text-muted-foreground">
        Add at least {MIN_ITEMS_FOR_GENERATE} ready pieces before generating outfits.
        You have {readyCount}.
      </p>
    );
  }

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await generateCombinationsAction(initial, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.jobId) {
        router.push(`/wardrobe/pending/${result.jobId}?kind=generate`);
      }
    });
  }

  return (
    <form
      action={onSubmit}
      className="space-y-4 rounded-[1.5rem] border border-border bg-mist/40 p-5"
    >
      <div>
        <h3 className="font-display text-xl tracking-tight">Generate outfits</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          AI proposes combinations using only items in your wardrobe. You can favorite or
          discard them afterward.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="gen_occasion">Occasion</Label>
          <select
            id="gen_occasion"
            name="occasion"
            className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            defaultValue=""
          >
            <option value="">Any</option>
            {WARDROBE_OCCASIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gen_count">How many</Label>
          <select
            id="gen_count"
            name="count"
            className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            defaultValue={String(MAX_GENERATE_COUNT)}
          >
            {Array.from({ length: MAX_GENERATE_COUNT }, (_, i) => i + 1).map(
              (value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ),
            )}
          </select>
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Starting…" : "Generate outfits"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
