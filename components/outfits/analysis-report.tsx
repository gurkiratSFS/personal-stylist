"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveLookAction, unsaveLookAction } from "@/app/outfits/actions";
import { CategoryScoreBar } from "@/components/outfits/category-score-bar";
import { FollowUpThread, type FollowUpItem } from "@/components/outfits/follow-up-thread";
import { ScoreRing } from "@/components/outfits/score-ring";
import { Button } from "@/components/ui/button";
import { labelFor, OUTFIT_OCCASIONS } from "@/lib/outfits/options";

type CategoryScore = {
  name: string;
  score: number;
  reason: string;
};

export function AnalysisReport({
  analysis,
  outfit,
  recommendations,
  followUps,
  signedUrl,
  saved,
  visionReady,
}: {
  analysis: {
    id: string;
    overall_score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    confidence: string;
    category_scores: unknown;
    feedback_depth: string;
  };
  outfit: {
    id: string;
    title: string | null;
    occasion: string | null;
  } | null;
  recommendations: Array<{ id: string; content: string; recommendation_type: string }>;
  followUps: FollowUpItem[];
  signedUrl: string | null;
  saved: boolean;
  visionReady: boolean;
}) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(saved);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const categories = Array.isArray(analysis.category_scores)
    ? (analysis.category_scores as CategoryScore[])
    : [];

  function toggleSave() {
    startTransition(async () => {
      if (isSaved) {
        await unsaveLookAction(outfit!.id);
        setIsSaved(false);
      } else {
        await saveLookAction(outfit!.id);
        setIsSaved(true);
      }
      router.refresh();
    });
  }

  async function copySummary() {
    const text = [
      `Overall ${Number(analysis.overall_score).toFixed(1)}/10`,
      analysis.summary,
      "",
      "What works:",
      ...analysis.strengths.map((item) => `• ${item}`),
      "",
      "What could improve:",
      ...analysis.improvements.map((item) => `• ${item}`),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopyMessage("Summary copied.");
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative min-h-80 overflow-hidden rounded-[1.6rem] border border-border bg-mist">
          {signedUrl ? (
            <Image
              src={signedUrl}
              alt={outfit?.title || "Analyzed outfit"}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Preview unavailable
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs tracking-[0.18em] text-accent uppercase">
              Outfit report
            </p>
            <h1 className="mt-2 font-display text-4xl tracking-tight">
              {outfit?.title?.trim() || "Your styling assessment"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {outfit?.occasion
                ? `Occasion · ${labelFor(OUTFIT_OCCASIONS, outfit.occasion)}`
                : "Occasion unspecified"}
              {" · "}
              Confidence {analysis.confidence}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <ScoreRing score={Number(analysis.overall_score)} />
            <p className="max-w-md text-lg text-muted-foreground">{analysis.summary}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={!outfit || pending}
              onClick={toggleSave}
            >
              {isSaved ? "Unsave look" : "Save look"}
            </Button>
            <Button type="button" variant="outline" onClick={copySummary}>
              Copy summary
            </Button>
          </div>
          {copyMessage ? (
            <p className="text-sm text-muted-foreground" role="status">
              {copyMessage}
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.4rem] border border-border bg-card px-5 py-5">
          <h2 className="font-display text-2xl tracking-tight">What works</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {analysis.strengths.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-[1.4rem] border border-border bg-card px-5 py-5">
          <h2 className="font-display text-2xl tracking-tight">What could improve</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {analysis.improvements.length === 0 ? (
              <li>No major changes suggested.</li>
            ) : (
              analysis.improvements.map((item) => <li key={item}>• {item}</li>)
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-border bg-card px-5 py-2 sm:px-6">
        <div className="border-b border-border py-5">
          <h2 className="font-display text-2xl tracking-tight">Category scores</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Transparent styling assessment — not attractiveness or personal worth.
          </p>
        </div>
        {categories.map((category) => (
          <CategoryScoreBar
            key={category.name}
            name={category.name}
            score={category.score}
            reason={category.reason}
          />
        ))}
      </section>

      {recommendations.length > 0 ? (
        <section className="rounded-[1.4rem] border border-border bg-mist/50 px-5 py-6">
          <h2 className="font-display text-2xl tracking-tight">Try instead</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {recommendations.map((item) => (
              <li key={item.id}>• {item.content}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <FollowUpThread
        analysisId={analysis.id}
        items={followUps}
        visionReady={visionReady}
      />

      <p className="text-xs text-muted-foreground">
        This is a styling assessment, not a measure of attractiveness or personal worth.
      </p>
    </div>
  );
}
