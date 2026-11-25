"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  pollOutfitJob,
  postFollowUpAction,
  type OutfitActionState,
} from "@/app/outfits/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: OutfitActionState = { error: null, message: null };

export type FollowUpItem = {
  id: string;
  question: string;
  answer: string | null;
  created_at: string;
};

export function FollowUpThread({
  analysisId,
  items,
  visionReady,
}: {
  analysisId: string;
  items: FollowUpItem[];
  visionReady: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    postFollowUpAction,
    initialState,
  );

  useEffect(() => {
    if (!state.jobId) {
      if (state.message) router.refresh();
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const result = await pollOutfitJob(state.jobId!);
        if (cancelled) return;
        if (result.status === "succeeded" || result.status === "failed") {
          router.refresh();
          return;
        }
        timer = setTimeout(tick, 1500);
      } catch {
        if (!cancelled) router.refresh();
      }
    }

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [state.jobId, state.message, router]);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs tracking-[0.18em] text-accent uppercase">Follow-up</p>
        <h2 className="mt-2 font-display text-2xl tracking-tight">
          Ask about this report
        </h2>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No follow-ups yet. Ask about footwear swaps, layering, or occasion fit.
          </p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border bg-card px-4 py-4"
            >
              <p className="text-sm font-medium">You asked</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.question}</p>
              <p className="mt-3 text-sm font-medium">Stylist</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.answer || "Thinking… refresh in a moment."}
              </p>
            </article>
          ))
        )}
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="analysis_id" value={analysisId} />
        <div className="space-y-2">
          <Label htmlFor="follow_up_question">Question</Label>
          <textarea
            id="follow_up_question"
            name="question"
            rows={3}
            required
            disabled={!visionReady || pending}
            className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm"
            placeholder="Would a leather belt tighten this look for dinner?"
          />
        </div>
        <Button type="submit" disabled={!visionReady || pending}>
          {pending ? "Sending…" : "Ask follow-up"}
        </Button>
        {state.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
