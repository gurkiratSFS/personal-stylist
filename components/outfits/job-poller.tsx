"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  pollOutfitJob,
  retryOutfitAnalysisAction,
} from "@/app/outfits/actions";
import { ReportSkeleton } from "@/components/outfits/report-skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function JobPoller({
  jobId,
  redirectOnSuccess = true,
}: {
  jobId: string;
  redirectOnSuccess?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState("Analysis didn’t finish");
  const [retryable, setRetryable] = useState(true);
  const [status, setStatus] = useState("queued");
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isRetrying, startRetry] = useTransition();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const result = await pollOutfitJob(jobId);
        if (cancelled) return;
        setStatus(result.status);

        if (result.status === "succeeded" && result.analysisId) {
          if (redirectOnSuccess) {
            router.replace(`/analyze/${result.analysisId}`);
          } else {
            router.refresh();
          }
          return;
        }

        if (result.status === "failed") {
          setError(
            result.error ||
              "We couldn’t finish this analysis right now. Please try again in a moment.",
          );
          setErrorTitle(result.errorTitle || "Analysis didn’t finish");
          setRetryable(result.retryable ?? true);
          return;
        }

        timer = setTimeout(tick, 1500);
      } catch {
        if (cancelled) return;
        setErrorTitle("Connection issue");
        setError(
          "We couldn’t check analysis status. Please try again in a moment.",
        );
        setRetryable(true);
      }
    }

    void tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId, redirectOnSuccess, router]);

  function onRetry() {
    setRetryError(null);
    startRetry(async () => {
      const result = await retryOutfitAnalysisAction(jobId);
      if (result.error || !result.jobId) {
        setRetryError(
          result.error ||
            "We couldn’t restart this analysis. Please try again shortly.",
        );
        return;
      }
      router.replace(`/analyze/pending/${result.jobId}`);
    });
  }

  if (error) {
    return (
      <div className="rounded-[1.4rem] border border-border bg-card px-6 py-8">
        <p className="text-xs tracking-[0.18em] text-accent uppercase">
          Analysis paused
        </p>
        <h2 className="mt-3 font-display text-3xl tracking-tight">{errorTitle}</h2>
        <p className="mt-3 text-muted-foreground">{error}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          Your photo is still saved privately.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {retryable ? (
            <Button type="button" disabled={isRetrying} onClick={onRetry}>
              {isRetrying ? "Retrying…" : "Try again"}
            </Button>
          ) : null}
          <Link
            href="/analyze"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to analyzer
          </Link>
        </div>
        {retryError ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {retryError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.2rem] border border-border bg-mist/70 px-5 py-4 space-y-2">
        <p className="text-sm text-muted-foreground">
          Status:{" "}
          <span className="font-medium text-foreground capitalize">{status}</span>
          . This usually takes a few seconds.
        </p>
        <p className="text-sm text-muted-foreground">
          You can leave this screen anytime. Analysis continues in the background, and the report
          will appear under Recent and Uploads when it’s done.
        </p>
        <Link
          href="/analyze"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Leave and keep working
        </Link>
      </div>
      <ReportSkeleton />
    </div>
  );
}
