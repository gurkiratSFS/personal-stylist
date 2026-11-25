"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  pollWardrobeJob,
  retryWardrobeJobAction,
} from "@/app/wardrobe/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WardrobeJobPoller({
  jobId,
  kind = "categorize",
}: {
  jobId: string;
  kind?: "categorize" | "generate";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const pendingPath = `/wardrobe/pending/${jobId}`;
  const stillOnPending = useRef(true);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState("Request didn’t finish");
  const [retryable, setRetryable] = useState(true);
  const [status, setStatus] = useState("queued");
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isRetrying, startRetry] = useTransition();

  useEffect(() => {
    stillOnPending.current = pathname.startsWith(pendingPath);
  }, [pathname, pendingPath]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const result = await pollWardrobeJob(jobId);
        if (cancelled) return;
        setStatus(result.status);

        if (result.status === "succeeded") {
          // Don't yank the user back if they already left this pending screen.
          if (!stillOnPending.current) return;
          if (kind === "generate") {
            router.replace("/wardrobe/combinations");
          } else if (result.itemId) {
            router.replace(`/wardrobe/${result.itemId}`);
          } else {
            router.replace("/wardrobe");
          }
          return;
        }

        if (result.status === "failed") {
          setError(
            result.error ||
              "We couldn’t finish this request right now. Please try again.",
          );
          setErrorTitle(result.errorTitle || "Request didn’t finish");
          setRetryable(result.retryable ?? true);
          return;
        }

        timer = setTimeout(tick, 1500);
      } catch {
        if (cancelled) return;
        setErrorTitle("Connection issue");
        setError("We couldn’t check status. Please try again in a moment.");
        setRetryable(true);
      }
    }

    void tick();

    return () => {
      cancelled = true;
      stillOnPending.current = false;
      if (timer) clearTimeout(timer);
    };
  }, [jobId, kind, router]);

  function onRetry() {
    setRetryError(null);
    startRetry(async () => {
      const result = await retryWardrobeJobAction(jobId);
      if (result.error) {
        setRetryError(result.error);
        return;
      }
      if (result.jobId) {
        const suffix = kind === "generate" ? "?kind=generate" : "";
        router.replace(`/wardrobe/pending/${result.jobId}${suffix}`);
      }
    });
  }

  const leaveHref =
    kind === "generate" ? "/wardrobe/combinations" : "/wardrobe";

  if (error) {
    return (
      <section className="rounded-[1.5rem] border border-border bg-mist/50 px-6 py-8">
        <p className="text-xs tracking-[0.18em] text-accent uppercase">Issue</p>
        <h2 className="mt-2 font-display text-2xl tracking-tight">{errorTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        {retryError ? (
          <p className="mt-2 text-sm text-destructive">{retryError}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {retryable ? (
            <Button type="button" onClick={onRetry} disabled={isRetrying}>
              {isRetrying ? "Retrying…" : "Try again"}
            </Button>
          ) : null}
          <Link
            href={leaveHref}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[1.5rem] border border-border bg-mist/40 px-6 py-10 text-center">
      <p className="text-xs tracking-[0.18em] text-accent uppercase">
        Working in the background
      </p>
      <h2 className="mt-3 font-display text-3xl tracking-tight">
        {kind === "generate"
          ? "Building outfits from your closet"
          : "Categorizing your piece"}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        You can leave this page — we’ll keep going. Status: {status}.
      </p>
      <div className="mx-auto mt-8 h-1.5 w-40 overflow-hidden rounded-full bg-border">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
      </div>
      <div className="mt-8">
        <Link
          href={leaveHref}
          className={cn(buttonVariants({ variant: "outline" }))}
          onClick={() => {
            stillOnPending.current = false;
          }}
        >
          {kind === "generate" ? "View combinations" : "Back to wardrobe"}
        </Link>
      </div>
    </section>
  );
}
