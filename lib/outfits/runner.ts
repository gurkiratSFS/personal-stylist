import { timingSafeEqual } from "crypto";

import { getAppUrl, getInternalRunnerToken } from "@/lib/env";

export function authorizeRunnerToken(header: string | null) {
  const expected = getInternalRunnerToken();
  if (!expected) return false;
  if (!header?.startsWith("Bearer ")) return false;
  const provided = header.slice("Bearer ".length).trim();
  if (!provided || provided.length !== expected.length) return false;

  try {
    return timingSafeEqual(
      Buffer.from(provided),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

export async function triggerOutfitJob(jobId: string) {
  const token = getInternalRunnerToken();
  if (!token) {
    console.error("[outfit-runner] INTERNAL_RUNNER_TOKEN is not configured.");
    return { ok: false as const, error: "missing_runner_token" };
  }

  const base = getAppUrl();
  const url = `${base.replace(/\/$/, "")}/api/ai/outfit/run?job=${encodeURIComponent(jobId)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Job row is already updated by the runner; avoid unhandledRejection in after().
      const text = await response.text().catch(() => "");
      console.error(
        `[outfit-runner] job ${jobId} failed (${response.status}): ${text.slice(0, 200)}`,
      );
      return { ok: false as const, error: "runner_failed" };
    }

    const payload = await response.json().catch(() => ({ ok: true }));
    return { ok: true as const, payload };
  } catch (error) {
    console.error(
      `[outfit-runner] job ${jobId} request error:`,
      error instanceof Error ? error.message : error,
    );
    return { ok: false as const, error: "runner_request_failed" };
  }
}
