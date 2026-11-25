"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

import {
  createCombinationAction,
  type WardrobeActionState,
} from "@/app/wardrobe/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  WARDROBE_OCCASIONS,
  slotForCategory,
  slotsConflict,
} from "@/lib/wardrobe/options";

const initial: WardrobeActionState = { error: null, message: null };

type ReadyItem = {
  id: string;
  name: string | null;
  category: string | null;
  signedUrl: string | null;
};

export function CombinationBuilder({ items }: { items: ReadyItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    createCombinationAction,
    initial,
  );

  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  useEffect(() => {
    if (state.combinationId && !state.error) {
      router.refresh();
    }
  }, [state.combinationId, state.error, router]);

  function toggle(id: string) {
    setHint(null);
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((value) => value !== id);
      }

      const nextItem = itemsById.get(id);
      const nextSlot = slotForCategory(nextItem?.category);
      for (const selectedId of prev) {
        const current = itemsById.get(selectedId);
        const currentSlot = slotForCategory(current?.category);
        if (slotsConflict(nextSlot, currentSlot)) {
          setHint(
            nextSlot === currentSlot
              ? `You already picked a ${current?.category?.replaceAll("_", " ") || "similar"} piece. Swap it out first.`
              : "That piece doesn’t work with a dress already in this look.",
          );
          return prev;
        }
      }
      return [...prev, id];
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add ready wardrobe items before building a combination.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5 rounded-[1.5rem] border border-border p-5">
      <div>
        <h3 className="font-display text-xl tracking-tight">Build a look</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick pieces you own. Same-slot items (two jeans, two pairs of shoes, two tops)
          can’t be combined.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="combo_title">Title</Label>
          <input
            id="combo_title"
            name="title"
            required
            className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
            placeholder="Weekend brunch"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="combo_occasion">Occasion</Label>
          <select
            id="combo_occasion"
            name="occasion"
            className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            defaultValue=""
          >
            <option value="">Unspecified</option>
            {WARDROBE_OCCASIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Pieces</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => {
            const active = selected.includes(item.id);
            const itemSlot = slotForCategory(item.category);
            const blocked =
              !active &&
              selected.some((selectedId) => {
                const current = itemsById.get(selectedId);
                return slotsConflict(itemSlot, slotForCategory(current?.category));
              });

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                disabled={blocked}
                title={
                  blocked
                    ? "Conflicts with a piece already in this look"
                    : undefined
                }
                className={`overflow-hidden rounded-xl border text-left transition-colors ${
                  active
                    ? "border-accent ring-1 ring-accent"
                    : blocked
                      ? "cursor-not-allowed border-border opacity-40"
                      : "border-border hover:border-accent/40"
                }`}
              >
                <div className="relative aspect-square bg-mist">
                  {item.signedUrl ? (
                    <Image
                      src={item.signedUrl}
                      alt={item.name || "Item"}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <p className="truncate px-2 py-1.5 text-xs">
                  {item.name || "Untitled"}
                </p>
                {active ? (
                  <input type="hidden" name="item_ids" value={item.id} />
                ) : null}
              </button>
            );
          })}
        </div>
        {hint ? (
          <p className="text-sm text-muted-foreground" role="status">
            {hint}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending || selected.length === 0}>
        {pending ? "Saving…" : "Save combination"}
      </Button>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.message ? (
        <p className="text-sm text-muted-foreground">{state.message}</p>
      ) : null}
    </form>
  );
}
