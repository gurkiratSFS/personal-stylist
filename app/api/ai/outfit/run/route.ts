import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeRunnerToken } from "@/lib/outfits/runner";
import { processOutfitAnalysisJob } from "@/lib/outfits/service";

const jobIdSchema = z.uuid();

export async function POST(request: Request) {
  if (!authorizeRunnerToken(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = jobIdSchema.safeParse(url.searchParams.get("job"));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  try {
    const result = await processOutfitAnalysisJob(parsed.data);
    if (!result.ok) {
      if (result.error === "Job not found" || result.error === "job_not_found") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 500 },
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Job processing failed";
    if (message === "Job not found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
