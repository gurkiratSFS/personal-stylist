"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { Heart, X } from "lucide-react";

import {
  deleteCombinationAction,
  toggleFavoriteCombinationAction,
  type WardrobeActionState,
} from "@/app/wardrobe/actions";
import { Button } from "@/components/ui/button";
import { labelFor, WARDROBE_OCCASIONS } from "@/lib/wardrobe/options";
import { cn } from "@/lib/utils";

const initial: WardrobeActionState = { error: null, message: null };

type ComboItem = {
  id: string;
  name: string | null;
  signedUrl: string | null;
};

type Combo = {
  id: string;
  title: string;
  occasion: string | null;
  notes: string | null;
  is_favorite: boolean;
  source: string;
  items: Array<ComboItem | null>;
};

export function CombinationList({ combinations }: { combinations: Combo[] }) {
  const router = useRouter();
  const titleId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = combinations.find((combo) => combo.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selected]);

  if (combinations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No combinations yet. Build one manually or generate outfits from your closet.
      </p>
    );
  }

  function toggleFavorite(combo: Combo) {
    const formData = new FormData();
    formData.set("combination_id", combo.id);
    formData.set("is_favorite", combo.is_favorite ? "false" : "true");
    startTransition(async () => {
      await toggleFavoriteCombinationAction(initial, formData);
      router.refresh();
    });
  }

  function discard(combo: Combo) {
    const formData = new FormData();
    formData.set("combination_id", combo.id);
    startTransition(async () => {
      await deleteCombinationAction(initial, formData);
      setSelectedId(null);
      router.refresh();
    });
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {combinations.map((combo) => {
          const thumbs = combo.items.filter(Boolean).slice(0, 3) as ComboItem[];
          return (
            <li key={combo.id}>
              <button
                type="button"
                onClick={() => setSelectedId(combo.id)}
                className="group w-full overflow-hidden rounded-[1.1rem] border border-border bg-card text-left transition-colors hover:border-accent/40"
              >
                <div className="relative aspect-[4/3] bg-mist">
                  {thumbs.length === 0 ? null : thumbs.length === 1 ? (
                    thumbs[0].signedUrl ? (
                      <Image
                        src={thumbs[0].signedUrl}
                        alt={combo.title}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    ) : null
                  ) : (
                    <div className="absolute inset-0 grid grid-cols-2 gap-0.5 p-0.5">
                      {thumbs.slice(0, 2).map((item, index) => (
                        <div
                          key={item.id}
                          className={cn(
                            "relative overflow-hidden bg-mist",
                            thumbs.length > 2 && index === 1 && "row-span-1",
                          )}
                        >
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
                      ))}
                      {thumbs[2] ? (
                        <div className="relative col-span-2 overflow-hidden bg-mist">
                          {thumbs[2].signedUrl ? (
                            <Image
                              src={thumbs[2].signedUrl}
                              alt={thumbs[2].name || "Item"}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )}
                  {combo.is_favorite ? (
                    <span className="absolute top-2 right-2 rounded-full bg-ink/70 p-1.5 text-white">
                      <Heart className="size-3 fill-current" aria-hidden />
                    </span>
                  ) : null}
                </div>
                <div className="space-y-0.5 px-3 py-2.5">
                  <p className="truncate text-sm font-medium">{combo.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {[
                      labelFor(WARDROBE_OCCASIONS, combo.occasion),
                      combo.source === "ai" ? "AI" : "Manual",
                      `${combo.items.filter(Boolean).length} pieces`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-ink/50"
            aria-label="Close look details"
            onClick={() => setSelectedId(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.5rem] border border-border bg-background shadow-xl sm:rounded-[1.5rem]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs tracking-[0.18em] text-accent uppercase">
                  Saved look
                </p>
                <h3
                  id={titleId}
                  className="mt-1 truncate font-display text-2xl tracking-tight"
                >
                  {selected.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[
                    labelFor(WARDROBE_OCCASIONS, selected.occasion),
                    selected.source === "ai" ? "AI suggested" : "Manual",
                    selected.is_favorite ? "Favorite" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 shrink-0 px-0"
                aria-label="Close"
                onClick={() => setSelectedId(null)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="space-y-5 overflow-y-auto px-5 py-5">
              {selected.notes ? (
                <p className="text-sm text-muted-foreground">{selected.notes}</p>
              ) : null}

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {selected.items.filter(Boolean).map((item) =>
                  item ? (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-xl border border-border"
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
                      <p className="truncate px-2 py-1.5 text-[11px] text-muted-foreground">
                        {item.name || "Untitled"}
                      </p>
                    </div>
                  ) : null,
                )}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => toggleFavorite(selected)}
                >
                  {selected.is_favorite ? "Unfavorite" : "Favorite"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => discard(selected)}
                >
                  Discard
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
