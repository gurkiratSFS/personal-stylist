import { getAppUrl, getInternalRunnerToken } from "@/lib/env";
import { authorizeRunnerToken } from "@/lib/outfits/runner";

export { authorizeRunnerToken };

export async function triggerWardrobeJob(jobId: string) {
  const token = getInternalRunnerToken();
  if (!token) {
    console.error("[wardrobe-runner] INTERNAL_RUNNER_TOKEN is not configured.");
    return { ok: false as const, error: "missing_runner_token" };
  }

  const base = getAppUrl();
  const url = `${base.replace(/\/$/, "")}/api/ai/wardrobe/run?job=${encodeURIComponent(jobId)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(
        `[wardrobe-runner] job ${jobId} failed (${response.status}): ${text.slice(0, 200)}`,
      );
      return { ok: false as const, error: "runner_failed" };
    }

    const payload = await response.json().catch(() => ({ ok: true }));
    return { ok: true as const, payload };
  } catch (error) {
    console.error(
      `[wardrobe-runner] job ${jobId} request error:`,
      error instanceof Error ? error.message : error,
    );
    return { ok: false as const, error: "runner_request_failed" };
  }
}
