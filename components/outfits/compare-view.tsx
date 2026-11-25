"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  pollCompareJob,
  startCompareAction,
  type OutfitActionState,
} from "@/app/outfits/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: OutfitActionState = { error: null, message: null };

type LookOption = {
  outfitId: string;
  title: string;
  signedUrl: string | null;
};

export function CompareView({
  options,
  visionReady,
}: {
  options: LookOption[];
  visionReady: boolean;
}) {
  const router = useRouter();
  const [outfitA, setOutfitA] = useState(options[0]?.outfitId ?? "");
  const [outfitB, setOutfitB] = useState(options[1]?.outfitId ?? "");
  const [compareResult, setCompareResult] = useState<{
    summary: string;
    prefer: "a" | "b" | "tie";
    reasons: string[];
  } | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    startCompareAction,
    initialState,
  );

  useEffect(() => {
    if (!state.jobId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const result = await pollCompareJob(state.jobId!);
        if (cancelled) return;
        if (result.status === "succeeded" && result.result?.compare) {
          setCompareResult(result.result.compare);
          router.refresh();
          return;
        }
        if (result.status === "failed") {
          setPollError(
            result.error ||
              "We couldn’t finish this comparison right now. Please try again in a moment.",
          );
          return;
        }
        timer = setTimeout(tick, 1500);
      } catch {
        if (cancelled) return;
        setPollError(
          "We couldn’t check comparison status. Please try again in a moment.",
        );
      }
    }

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [state.jobId, router]);

  const lookA = options.find((item) => item.outfitId === outfitA);
  const lookB = options.find((item) => item.outfitId === outfitB);

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="outfit_a_id" value={outfitA} />
        <input type="hidden" name="outfit_b_id" value={outfitB} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="outfit_a">Look A</Label>
            <select
              id="outfit_a"
              value={outfitA}
              onChange={(event) => setOutfitA(event.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              {options.map((option) => (
                <option key={option.outfitId} value={option.outfitId}>
                  {option.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="outfit_b">Look B</Label>
            <select
              id="outfit_b"
              value={outfitB}
              onChange={(event) => setOutfitB(event.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              {options.map((option) => (
                <option key={option.outfitId} value={option.outfitId}>
                  {option.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative h-56 overflow-hidden rounded-[1.3rem] border border-border bg-mist">
            {lookA?.signedUrl ? (
              <Image src={lookA.signedUrl} alt={lookA.title} fill unoptimized className="object-cover" />
            ) : null}
          </div>
          <div className="relative h-56 overflow-hidden rounded-[1.3rem] border border-border bg-mist">
            {lookB?.signedUrl ? (
              <Image src={lookB.signedUrl} alt={lookB.title} fill unoptimized className="object-cover" />
            ) : null}
          </div>
        </div>

        <Button type="submit" disabled={!visionReady || pending || options.length < 2}>
          {pending || state.jobId ? "Comparing…" : "Compare looks"}
        </Button>
        {state.error || pollError ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error || pollError}
          </p>
        ) : null}
      </form>

      {compareResult ? (
        <section className="rounded-[1.4rem] border border-border bg-card px-5 py-6">
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Comparison</p>
          <h2 className="mt-2 font-display text-3xl tracking-tight">
            {compareResult.prefer === "tie"
              ? "These looks are evenly matched"
              : compareResult.prefer === "a"
                ? "Look A edges ahead"
                : "Look B edges ahead"}
          </h2>
          <p className="mt-3 text-muted-foreground">{compareResult.summary}</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {compareResult.reasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
