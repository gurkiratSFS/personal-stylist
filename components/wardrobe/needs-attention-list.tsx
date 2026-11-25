"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  categorizeWardrobeItemAction,
  deleteWardrobeItemAction,
  type WardrobeActionState,
} from "@/app/wardrobe/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AttentionItem = {
  id: string;
  name: string | null;
  signedUrl: string | null;
  jobStatus: string | null;
  jobError: string | null;
  failedJobId: string | null;
  consent_ai_processing: string;
};

const initial: WardrobeActionState = { error: null, message: null };

export function WardrobeNeedsAttentionList({
  items,
  visionReady,
}: {
  items: AttentionItem[];
  visionReady: boolean;
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(
    key: string,
    action: (prev: WardrobeActionState, formData: FormData) => Promise<WardrobeActionState>,
    formData: FormData,
  ) {
    setError(null);
    setPendingKey(key);
    startTransition(async () => {
      const result = await action(initial, formData);
      setPendingKey(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.jobId) {
        router.push(`/wardrobe/pending/${result.jobId}`);
        return;
      }
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing needs attention. Draft uploads and failed categorizations will show up here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-4 rounded-[1.25rem] border border-border p-4 sm:flex-row sm:items-center"
          >
            <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-mist">
              {item.signedUrl ? (
                <Image
                  src={item.signedUrl}
                  alt={item.name || "Draft item"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-medium">{item.name || "Untitled draft"}</p>
              <p className="text-sm text-muted-foreground">
                {item.jobError ||
                  (item.jobStatus === "failed"
                    ? "Categorization failed."
                    : "Needs a category or AI retry.")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/wardrobe/${item.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Edit
              </Link>
              {visionReady && item.consent_ai_processing === "granted" ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending && pendingKey === `retry:${item.id}`}
                  onClick={() => {
                    const formData = new FormData();
                    formData.set("item_id", item.id);
                    run(`retry:${item.id}`, categorizeWardrobeItemAction, formData);
                  }}
                >
                  {isPending && pendingKey === `retry:${item.id}`
                    ? "Starting…"
                    : "Try again"}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending && pendingKey === `remove:${item.id}`}
                onClick={() => {
                  const formData = new FormData();
                  formData.set("item_id", item.id);
                  run(`remove:${item.id}`, deleteWardrobeItemAction, formData);
                }}
              >
                {isPending && pendingKey === `remove:${item.id}`
                  ? "Removing…"
                  : "Remove"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
