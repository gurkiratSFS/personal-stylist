import { connection } from "next/server";

import { WardrobeJobPoller } from "@/components/wardrobe/wardrobe-job-poller";
import { requireUser } from "@/lib/auth/session";
import { getWardrobeJobStatus } from "@/lib/wardrobe/service";

export const metadata = { title: "Wardrobe job" };
export const instant = false;

export default async function WardrobePendingPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  await connection();
  const user = await requireUser();
  const { jobId } = await params;
  const { kind } = await searchParams;

  const status = await getWardrobeJobStatus(user.id, jobId);
  const resolvedKind =
    kind === "generate" ||
    status.jobType === "wardrobe_generate_combinations"
      ? "generate"
      : "categorize";

  return (
    <WardrobeJobPoller jobId={jobId} kind={resolvedKind} />
  );
}
