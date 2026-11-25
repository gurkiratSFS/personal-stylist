import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";

import { JobPoller } from "@/components/outfits/job-poller";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getOutfitJobStatus } from "@/lib/outfits/service";
import { cn } from "@/lib/utils";

export const metadata = { title: "Analyzing outfit" };
export const instant = false;

export default async function PendingAnalysisPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  await connection();
  const user = await requireUser();
  const { jobId } = await params;

  let status;
  try {
    status = await getOutfitJobStatus(user.id, jobId);
  } catch {
    notFound();
  }

  if (status.status === "succeeded" && status.analysisId) {
    redirect(`/analyze/${status.analysisId}`);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs tracking-[0.18em] text-accent uppercase">In progress</p>
        <h1 className="font-display text-4xl tracking-tight">Reading your outfit</h1>
        <p className="max-w-2xl text-muted-foreground">
          Analysis keeps running in the background. Feel free to leave this page — browse home,
          edit Style DNA, or open Uploads later. We’ll save the report when it’s ready.
        </p>
      </div>
      <JobPoller jobId={jobId} />
    </div>
  );
}
