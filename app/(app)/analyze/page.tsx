import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { AnalyzeToolbar } from "@/components/outfits/analyze-toolbar";
import { OutfitEmptyState } from "@/components/outfits/empty-state";
import { NeedsAttentionList } from "@/components/outfits/needs-attention-list";
import { SavedLookCard } from "@/components/outfits/saved-look-card";
import { SetupRequired } from "@/components/outfits/setup-required";
import { isVisionConfigured } from "@/lib/ai/vision/factory";
import { requireUser } from "@/lib/auth/session";
import {
  listOutfitUploadsNeedingAttention,
  listRecentAnalyses,
  listSavedLooks,
} from "@/lib/outfits/service";

export const metadata = { title: "Outfit Analyzer" };
export const instant = false;

export default async function AnalyzePage() {
  await connection();
  const user = await requireUser();
  const visionReady = isVisionConfigured();
  const [analyses, saved, uploads] = await Promise.all([
    listRecentAnalyses(user.id, 6),
    listSavedLooks(user.id),
    listOutfitUploadsNeedingAttention(user.id, 12),
  ]);

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <p className="text-xs tracking-[0.2em] text-accent uppercase">
          Outfit Analyzer
        </p>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
          Upload a look. Get guidance you can use.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Structured feedback on color, fit, occasion, footwear, accessories, and balance —
          never fake sample scores.
        </p>
        <Suspense
          fallback={
            <div className="h-11 w-full max-w-sm animate-pulse rounded-lg bg-mist" />
          }
        >
          <AnalyzeToolbar visionReady={visionReady} />
        </Suspense>
      </section>

      {!visionReady ? <SetupRequired /> : null}

      {uploads.length > 0 ? (
        <section>
          <NeedsAttentionList
            items={uploads}
            visionReady={visionReady}
            compact
          />
        </section>
      ) : null}

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-3xl tracking-tight">Recent</h2>
          <Link
            href="/analyze/history"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>
        {analyses.length === 0 ? (
          <OutfitEmptyState
            title="No analyses yet"
            body="Upload an outfit photo to get your first validated styling report."
            ctaHref={visionReady ? "/analyze?new=1" : "/analyze/history"}
            ctaLabel={visionReady ? "Analyze an outfit" : "Browse history"}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analyses.map((item) => (
              <Link
                key={item.id}
                href={`/analyze/${item.id}`}
                className="flex gap-3 rounded-[1.2rem] border border-border bg-card p-3 transition-colors hover:border-accent/40"
              >
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-mist">
                  {item.signedUrl ? (
                    <Image
                      src={item.signedUrl}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {item.outfits?.title || "Outfit report"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {Number(item.overall_score).toFixed(1)}/10 · {item.confidence} confidence
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-3xl tracking-tight">Saved looks</h2>
          <Link
            href="/analyze/saved"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Open saved
          </Link>
        </div>
        {saved.length === 0 ? (
          <OutfitEmptyState
            title="Nothing saved yet"
            body="Save a report you like and it will show up here for quick revisit and compare."
            ctaHref="/analyze/history"
            ctaLabel="Browse history"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saved.slice(0, 3).map((item) => (
              <SavedLookCard
                key={item.id}
                title={item.outfits?.title || "Saved look"}
                occasion={item.outfits?.occasion ?? null}
                signedUrl={item.signedUrl}
                href="/analyze/saved"
                notes={item.notes}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
