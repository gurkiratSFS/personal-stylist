"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";

import {
  categorizeWardrobeItemAction,
  deleteWardrobeItemAction,
  updateWardrobeItemAction,
  type WardrobeActionState,
} from "@/app/wardrobe/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { WARDROBE_CATEGORIES } from "@/lib/wardrobe/options";

const initial: WardrobeActionState = { error: null, message: null };

export function WardrobeItemEditForm({
  item,
  visionReady,
}: {
  item: {
    id: string;
    name: string | null;
    category: string | null;
    color: string | null;
    brand: string | null;
    status: string;
    consent_ai_processing: string;
  };
  visionReady: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateWardrobeItemAction,
    initial,
  );
  const [catState, catAction, catPending] = useActionState(
    categorizeWardrobeItemAction,
    initial,
  );
  const [delState, delAction, delPending] = useActionState(
    deleteWardrobeItemAction,
    initial,
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (catState.jobId && !catState.error) {
      router.push(`/wardrobe/pending/${catState.jobId}`);
    }
  }, [catState.jobId, catState.error, router]);

  useEffect(() => {
    if (delState.message && !delState.error) {
      router.push("/wardrobe");
    }
  }, [delState.message, delState.error, router]);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="item_id" value={item.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="edit_name">Name</Label>
            <input
              id="edit_name"
              name="name"
              defaultValue={item.name ?? ""}
              className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_category">Category</Label>
            <select
              id="edit_category"
              name="category"
              defaultValue={item.category ?? ""}
              className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="">Unset</option>
              {WARDROBE_CATEGORIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_color">Color</Label>
            <input
              id="edit_color"
              name="color"
              defaultValue={item.color ?? ""}
              className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_brand">Brand</Label>
            <input
              id="edit_brand"
              name="brand"
              defaultValue={item.brand ?? ""}
              className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
            />
          </div>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        {state.message ? (
          <p className="text-sm text-muted-foreground">{state.message}</p>
        ) : null}
      </form>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        {visionReady && item.consent_ai_processing === "granted" ? (
          <form action={catAction}>
            <input type="hidden" name="item_id" value={item.id} />
            <Button type="submit" variant="outline" disabled={catPending}>
              {catPending ? "Starting…" : "Re-categorize with AI"}
            </Button>
          </form>
        ) : null}
        <form
          action={(formData) => {
            startTransition(() => {
              delAction(formData);
            });
          }}
        >
          <input type="hidden" name="item_id" value={item.id} />
          <Button type="submit" variant="outline" disabled={delPending}>
            {delPending ? "Removing…" : "Remove item"}
          </Button>
        </form>
      </div>
      {catState.error ? (
        <p className="text-sm text-destructive">{catState.error}</p>
      ) : null}
      {delState.error ? (
        <p className="text-sm text-destructive">{delState.error}</p>
      ) : null}
    </div>
  );
}
