"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  analyzeExistingOutfitAction,
  deleteOutfitAction,
} from "@/app/outfits/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import type { OutfitUploadAttentionItem } from "@/lib/outfits/service";
import { labelFor, OUTFIT_OCCASIONS } from "@/lib/outfits/options";
import { cn } from "@/lib/utils";

function stateLabel(item: OutfitUploadAttentionItem) {
  if (item.state === "failed") return item.errorTitle || "Needs retry";
  if (item.state === "in_progress") return "In progress";
  return "Ready to analyze";
}

export function NeedsAttentionList({
  items,
  visionReady,
  compact = false,
  showHeader = true,
}: {
  items: OutfitUploadAttentionItem[];
  visionReady: boolean;
  compact?: boolean;
  showHeader?: boolean;
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) return null;

  const visible = compact ? items.slice(0, 4) : items;

  function retry(outfitId: string) {
    setLocalError(null);
    setPendingKey(`retry:${outfitId}`);
    startTransition(async () => {
      const result = await analyzeExistingOutfitAction(outfitId);
      setPendingKey(null);
      if (result.error || !result.jobId) {
        setLocalError(result.error || "Could not start analysis.");
        return;
      }
      router.push(`/analyze/pending/${result.jobId}`);
    });
  }

  function remove(outfitId: string) {
    setLocalError(null);
    setPendingKey(`remove:${outfitId}`);
    startTransition(async () => {
      const result = await deleteOutfitAction(outfitId);
      setPendingKey(null);
      if (result.error) {
        setLocalError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {showHeader ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.18em] text-accent uppercase">
              Uploads
            </p>
            <h2 className="mt-2 font-display text-3xl tracking-tight">
              Needs attention
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Draft uploads stay here so you can retry without choosing the photo again.
            </p>
          </div>
          {compact ? (
            <Link
              href="/analyze/uploads"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              View all
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        {visible.map((item) => (
          <article
            key={item.outfitId}
            className="flex flex-col gap-4 rounded-[1.2rem] border border-border bg-card p-3 sm:flex-row sm:items-center"
          >
            <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-mist sm:h-24 sm:w-20">
              {item.signedUrl ? (
                <Image
                  src={item.signedUrl}
                  alt={item.title || "Uploaded outfit"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : null}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate font-medium">
                {item.title?.trim() || "Untitled outfit"}
              </p>
              <p className="text-sm text-muted-foreground">
                {stateLabel(item)}
                {item.occasion
                  ? ` · ${labelFor(OUTFIT_OCCASIONS, item.occasion)}`
                  : ""}
              </p>
              {item.state === "failed" && item.error ? (
                <p className="text-sm text-muted-foreground">{item.error}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {item.state === "in_progress" && item.latestJobId ? (
                <Link
                  href={`/analyze/pending/${item.latestJobId}`}
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  Open status
                </Link>
              ) : null}

              {item.retryable ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={
                    !visionReady ||
                    (isPending && pendingKey !== null)
                  }
                  onClick={() => retry(item.outfitId)}
                >
                  {pendingKey === `retry:${item.outfitId}`
                    ? "Starting…"
                    : item.state === "failed"
                      ? "Try again"
                      : "Analyze"}
                </Button>
              ) : null}

              {!visionReady && item.retryable ? (
                <p className="self-center text-xs text-muted-foreground">
                  Retry when analysis is back online
                </p>
              ) : null}

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending && pendingKey !== null}
                onClick={() => remove(item.outfitId)}
              >
                {pendingKey === `remove:${item.outfitId}` ? "Removing…" : "Remove"}
              </Button>
            </div>
          </article>
        ))}
      </div>

      {localError ? (
        <p className="text-sm text-destructive" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
