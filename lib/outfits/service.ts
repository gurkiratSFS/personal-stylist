import { randomUUID } from "crypto";

import { getVisionAnalyzer } from "@/lib/ai/vision/factory";
import type { StyleContextSummary } from "@/lib/ai/vision/provider";
import {
  canAccessAnalysis,
  canAccessJob,
  canAccessOutfit,
  canAccessSavedLook,
  isOwnedOutfitPath,
} from "@/lib/outfits/access";
import {
  toUserFacingAnalysisErrorDetails,
} from "@/lib/outfits/errors";
import {
  compareReportSchema,
  followUpAnswerSchema,
  outfitAnalysisReportSchema,
  outfitUploadSchema,
  type CompareInput,
  type FollowUp,
  type OutfitUpload,
  type SaveLook,
  type StartAnalysis,
} from "@/lib/outfits/schemas";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

type JsonObject = Exclude<Json, string | number | boolean | null | Json[]>;

function asJsonObject(value: Record<string, unknown>): JsonObject {
  return value as JsonObject;
}

export const OUTFIT_IMAGES_BUCKET = "outfit-images";
const SIGNED_URL_SECONDS = 60 * 60;
const ANALYSIS_SIGNED_URL_SECONDS = 5 * 60;

const OUTFIT_COLUMNS =
  "id, user_id, title, image_path, occasion, notes, source, status, consent_storage, consent_ai_processing, bytes, mime_type, created_at, updated_at";

const ANALYSIS_COLUMNS =
  "id, outfit_id, user_id, job_id, feedback_depth, overall_score, category_scores, summary, strengths, improvements, confidence, model_provider, model_name, model_version, created_at";

const JOB_COLUMNS =
  "id, user_id, job_type, status, input_reference, result_reference, error, started_at, completed_at, created_at, updated_at";

export function buildOutfitStoragePath(
  userId: string,
  outfitId: string,
  filename: string,
) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return `${userId}/${outfitId}/${safe || "outfit.jpg"}`;
}

export async function createOutfitUploadTarget(
  viewerId: string,
  filename: string,
  mimeType: string,
) {
  const outfitId = randomUUID();
  const storagePath = buildOutfitStoragePath(viewerId, outfitId, filename);
  if (!isOwnedOutfitPath(viewerId, storagePath)) {
    throw new Error("Invalid storage path.");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.storage
    .from(OUTFIT_IMAGES_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error) throw new Error(error.message);

  return {
    outfitId,
    storagePath,
    mimeType,
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
  };
}

export async function registerOutfit(viewerId: string, input: OutfitUpload) {
  const values = outfitUploadSchema.parse(input);
  if (!isOwnedOutfitPath(viewerId, values.image_path)) {
    throw new Error("Outfits must be stored under your account folder.");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("outfits")
    .insert({
      user_id: viewerId,
      title: values.title ?? null,
      image_path: values.image_path,
      occasion: values.occasion ?? null,
      notes: values.notes ?? null,
      source: "upload",
      status: "draft",
      consent_storage: true,
      consent_ai_processing: values.consent_ai_processing,
      bytes: values.bytes ?? null,
      mime_type: values.mime_type ?? null,
    })
    .select(OUTFIT_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function loadStyleContext(
  userId: string,
): Promise<StyleContextSummary | undefined> {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("style_profiles")
    .select(
      "preferred_styles, fashion_categories, budget_band, climate, lifestyle, favorite_colors, disliked_colors, fit_preferences, summary",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return undefined;
  return data;
}

async function signOutfitImage(
  imagePath: string,
  seconds = ANALYSIS_SIGNED_URL_SECONDS,
) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.storage
    .from(OUTFIT_IMAGES_BUCKET)
    .createSignedUrl(imagePath, seconds);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Could not sign outfit image.");
  }
  return data.signedUrl;
}

export async function enqueueOutfitAnalysis(
  viewerId: string,
  input: StartAnalysis,
) {
  const supabase = await createServerSupabaseClient();
  const { data: outfit, error: outfitError } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .eq("id", input.outfit_id)
    .maybeSingle();

  if (outfitError) throw new Error(outfitError.message);
  if (!outfit) throw new Error("Outfit not found.");
  if (!canAccessOutfit(viewerId, outfit.user_id)) {
    throw new Error("You can only analyze your own outfits.");
  }
  if (outfit.consent_ai_processing !== "granted") {
    throw new Error("AI processing consent is required before analysis.");
  }

  const occasion = input.occasion ?? outfit.occasion;
  if (occasion && occasion !== outfit.occasion) {
    await supabase
      .from("outfits")
      .update({ occasion })
      .eq("id", outfit.id)
      .eq("user_id", viewerId);
  }

  const { data: job, error: jobError } = await supabase
    .from("ai_jobs")
    .insert({
      user_id: viewerId,
      job_type: "outfit_analysis",
      status: "queued",
      input_reference: asJsonObject({
        outfit_id: outfit.id,
        feedback_depth: input.feedback_depth,
        occasion: occasion ?? null,
      }),
    })
    .select(JOB_COLUMNS)
    .single();

  if (jobError) throw new Error(jobError.message);
  return { jobId: job.id, outfitId: outfit.id };
}

export async function getOutfitJobStatus(viewerId: string, jobId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: job, error } = await supabase
    .from("ai_jobs")
    .select(JOB_COLUMNS)
    .eq("id", jobId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!job) throw new Error("Job not found.");
  if (!canAccessJob(viewerId, job.user_id)) {
    throw new Error("You can only view your own jobs.");
  }

  const result = (job.result_reference ?? {}) as {
    analysis_id?: string;
    compare_id?: string;
    follow_up_id?: string;
  };

  const facing = job.error
    ? toUserFacingAnalysisErrorDetails(job.error)
    : null;

  return {
    id: job.id,
    status: job.status,
    error: facing?.message ?? null,
    errorTitle: facing?.title ?? null,
    retryable: facing?.retryable ?? false,
    analysisId: result.analysis_id ?? null,
    followUpId: result.follow_up_id ?? null,
    jobType: job.job_type,
  };
}

export async function retryFailedOutfitAnalysis(
  viewerId: string,
  failedJobId: string,
) {
  const supabase = await createServerSupabaseClient();
  const { data: job, error } = await supabase
    .from("ai_jobs")
    .select(JOB_COLUMNS)
    .eq("id", failedJobId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!job) throw new Error("Job not found.");
  if (!canAccessJob(viewerId, job.user_id)) {
    throw new Error("You can only retry your own jobs.");
  }
  if (job.job_type !== "outfit_analysis") {
    throw new Error("Only outfit analysis jobs can be retried here.");
  }
  if (job.status !== "failed") {
    throw new Error("Only failed analyses can be retried.");
  }

  const input = job.input_reference as {
    outfit_id?: string;
    feedback_depth?: "casual" | "detailed" | "improvement";
    occasion?: string | null;
  };

  if (!input.outfit_id || !input.feedback_depth) {
    throw new Error("Could not retry this analysis.");
  }

  return enqueueOutfitAnalysis(viewerId, {
    outfit_id: input.outfit_id,
    feedback_depth: input.feedback_depth,
    occasion: input.occasion ?? undefined,
  });
}

async function markJobFailed(jobId: string, message: string) {
  const supabase = createServiceSupabaseClient();
  await supabase
    .from("ai_jobs")
    .update({
      status: "failed",
      error: message,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

export async function processOutfitAnalysisJob(jobId: string) {
  const supabase = createServiceSupabaseClient();
  const { data: job, error: jobError } = await supabase
    .from("ai_jobs")
    .select(JOB_COLUMNS)
    .eq("id", jobId)
    .maybeSingle();

  if (jobError) throw new Error(jobError.message);
  if (!job) throw new Error("Job not found.");
  if (job.status === "succeeded") {
    return { ok: true as const, alreadyDone: true };
  }

  if (job.job_type === "outfit_follow_up") {
    return processFollowUpJob(jobId);
  }
  if (job.job_type === "outfit_compare") {
    return processCompareJob(jobId);
  }

  const input = job.input_reference as {
    outfit_id?: string;
    feedback_depth?: "casual" | "detailed" | "improvement";
    occasion?: string | null;
  };

  if (!input.outfit_id || !input.feedback_depth) {
    await markJobFailed(jobId, "invalid_job_input");
    return { ok: false as const, error: "invalid_job_input" };
  }

  await supabase
    .from("ai_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      error: null,
    })
    .eq("id", jobId);

  const { data: outfit, error: outfitError } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .eq("id", input.outfit_id)
    .maybeSingle();

  if (outfitError || !outfit) {
    await markJobFailed(jobId, "outfit_not_found");
    return { ok: false as const, error: "outfit_not_found" };
  }

  if (outfit.consent_ai_processing !== "granted") {
    await markJobFailed(jobId, "consent_denied");
    return { ok: false as const, error: "consent_denied" };
  }

  const vision = getVisionAnalyzer();
  if (!vision.ok) {
    await markJobFailed(jobId, "missing_key");
    return { ok: false as const, error: "missing_key" };
  }

  try {
    const imageUrl = await signOutfitImage(outfit.image_path);
    const styleContext = await loadStyleContext(outfit.user_id);
    const raw = await vision.analyzer.analyzeOutfit({
      imageUrl,
      occasion: input.occasion ?? outfit.occasion,
      feedbackDepth: input.feedback_depth,
      styleContext,
    });

    let report;
    try {
      report = outfitAnalysisReportSchema.parse(raw);
    } catch {
      await markJobFailed(jobId, "invalid_model_response");
      return { ok: false as const, error: "invalid_model_response" };
    }

    const usage =
      "lastUsage" in vision.analyzer
        ? (
            vision.analyzer as {
              lastUsage?: {
                promptTokenCount?: number;
                candidatesTokenCount?: number;
              } | null;
            }
          ).lastUsage
        : null;

    const { data: analysis, error: analysisError } = await supabase
      .from("outfit_analyses")
      .insert({
        outfit_id: outfit.id,
        user_id: outfit.user_id,
        job_id: jobId,
        feedback_depth: input.feedback_depth,
        overall_score: report.overall_score,
        category_scores: report.categories as unknown as JsonObject,
        summary: report.summary,
        strengths: report.strengths,
        improvements: report.improvements,
        confidence: report.confidence,
        model_provider: vision.analyzer.id,
        model_name: vision.analyzer.model,
        model_version: vision.analyzer.model,
      })
      .select(ANALYSIS_COLUMNS)
      .single();

    if (analysisError) {
      await markJobFailed(jobId, analysisError.message);
      return { ok: false as const, error: analysisError.message };
    }

    const recommendationRows = report.suggested_items.map((content, index) => ({
      analysis_id: analysis.id,
      user_id: outfit.user_id,
      recommendation_type:
        index === 0 ? ("alternative" as const) : ("accessory" as const),
      content,
      rank: index,
    }));

    if (recommendationRows.length > 0) {
      const { error: recError } = await supabase
        .from("outfit_recommendations")
        .insert(recommendationRows);
      if (recError) {
        await markJobFailed(jobId, recError.message);
        return { ok: false as const, error: recError.message };
      }
    }

    await supabase.from("ai_usage").insert({
      user_id: outfit.user_id,
      job_id: jobId,
      provider: vision.analyzer.id,
      model: vision.analyzer.model,
      operation: "outfit_analysis",
      prompt_tokens: usage?.promptTokenCount ?? null,
      output_tokens: usage?.candidatesTokenCount ?? null,
      usage_metadata: asJsonObject((usage ?? {}) as Record<string, unknown>),
    });

    const nextOccasion =
      input.occasion ??
      outfit.occasion ??
      (report.occasion === "unknown" ? null : report.occasion);

    await supabase
      .from("outfits")
      .update({
        status: "analyzed",
        occasion: nextOccasion,
      })
      .eq("id", outfit.id);

    await supabase
      .from("ai_jobs")
      .update({
        status: "succeeded",
        completed_at: new Date().toISOString(),
        result_reference: asJsonObject({ analysis_id: analysis.id }),
        error: null,
      })
      .eq("id", jobId);

    return { ok: true as const, analysisId: analysis.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "analysis_failed";
    await markJobFailed(jobId, message);
    return { ok: false as const, error: message };
  }
}

async function processFollowUpJob(jobId: string) {
  const supabase = createServiceSupabaseClient();
  const { data: job } = await supabase
    .from("ai_jobs")
    .select(JOB_COLUMNS)
    .eq("id", jobId)
    .single();

  if (!job) return { ok: false as const, error: "job_not_found" };

  const input = job.input_reference as {
    analysis_id?: string;
    follow_up_id?: string;
    question?: string;
  };

  await supabase
    .from("ai_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", jobId);

  if (!input.analysis_id || !input.follow_up_id || !input.question) {
    await markJobFailed(jobId, "invalid_job_input");
    return { ok: false as const, error: "invalid_job_input" };
  }

  const { data: analysis } = await supabase
    .from("outfit_analyses")
    .select(ANALYSIS_COLUMNS)
    .eq("id", input.analysis_id)
    .maybeSingle();

  if (!analysis) {
    await markJobFailed(jobId, "analysis_not_found");
    return { ok: false as const, error: "analysis_not_found" };
  }

  const { data: outfit } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .eq("id", analysis.outfit_id)
    .maybeSingle();

  if (!outfit) {
    await markJobFailed(jobId, "outfit_not_found");
    return { ok: false as const, error: "outfit_not_found" };
  }

  const vision = getVisionAnalyzer();
  if (!vision.ok) {
    await markJobFailed(jobId, "missing_key");
    return { ok: false as const, error: "missing_key" };
  }

  try {
    const imageUrl = await signOutfitImage(outfit.image_path);
    const raw = await vision.analyzer.answerFollowUp({
      imageUrl,
      question: input.question,
      priorSummary: analysis.summary,
      priorStrengths: analysis.strengths,
      priorImprovements: analysis.improvements,
    });

    let parsed;
    try {
      parsed = followUpAnswerSchema.parse(raw);
    } catch {
      await markJobFailed(jobId, "invalid_model_response");
      return { ok: false as const, error: "invalid_model_response" };
    }

    await supabase
      .from("outfit_follow_ups")
      .update({ answer: parsed.answer, job_id: jobId })
      .eq("id", input.follow_up_id);

    await supabase
      .from("ai_jobs")
      .update({
        status: "succeeded",
        completed_at: new Date().toISOString(),
        result_reference: asJsonObject({
          follow_up_id: input.follow_up_id,
          analysis_id: analysis.id,
        }),
      })
      .eq("id", jobId);

    return { ok: true as const, followUpId: input.follow_up_id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "follow_up_failed";
    await markJobFailed(jobId, message);
    return { ok: false as const, error: message };
  }
}

async function processCompareJob(jobId: string) {
  const supabase = createServiceSupabaseClient();
  const { data: job } = await supabase
    .from("ai_jobs")
    .select(JOB_COLUMNS)
    .eq("id", jobId)
    .single();

  if (!job) return { ok: false as const, error: "job_not_found" };

  const input = job.input_reference as {
    outfit_a_id?: string;
    outfit_b_id?: string;
  };

  await supabase
    .from("ai_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", jobId);

  if (!input.outfit_a_id || !input.outfit_b_id) {
    await markJobFailed(jobId, "invalid_job_input");
    return { ok: false as const, error: "invalid_job_input" };
  }

  const { data: outfits } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .in("id", [input.outfit_a_id, input.outfit_b_id]);

  const outfitA = outfits?.find((row) => row.id === input.outfit_a_id);
  const outfitB = outfits?.find((row) => row.id === input.outfit_b_id);

  if (!outfitA || !outfitB) {
    await markJobFailed(jobId, "outfit_not_found");
    return { ok: false as const, error: "outfit_not_found" };
  }

  const vision = getVisionAnalyzer();
  if (!vision.ok) {
    await markJobFailed(jobId, "missing_key");
    return { ok: false as const, error: "missing_key" };
  }

  try {
    const [imageUrlA, imageUrlB, styleContext] = await Promise.all([
      signOutfitImage(outfitA.image_path),
      signOutfitImage(outfitB.image_path),
      loadStyleContext(job.user_id),
    ]);

    const raw = await vision.analyzer.compareOutfits({
      imageUrlA,
      imageUrlB,
      occasionA: outfitA.occasion,
      occasionB: outfitB.occasion,
      styleContext,
    });

    let report;
    try {
      report = compareReportSchema.parse(raw);
    } catch {
      await markJobFailed(jobId, "invalid_model_response");
      return { ok: false as const, error: "invalid_model_response" };
    }

    await supabase
      .from("ai_jobs")
      .update({
        status: "succeeded",
        completed_at: new Date().toISOString(),
        result_reference: asJsonObject({
          compare: report,
          outfit_a_id: outfitA.id,
          outfit_b_id: outfitB.id,
        }),
      })
      .eq("id", jobId);

    return { ok: true as const, compare: report };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "compare_failed";
    await markJobFailed(jobId, message);
    return { ok: false as const, error: message };
  }
}

export async function listUserOutfits(viewerId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .eq("user_id", viewerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return Promise.all(
    (data ?? []).map(async (outfit) => {
      const { data: signed } = await supabase.storage
        .from(OUTFIT_IMAGES_BUCKET)
        .createSignedUrl(outfit.image_path, SIGNED_URL_SECONDS);
      return { ...outfit, signedUrl: signed?.signedUrl ?? null };
    }),
  );
}

export type OutfitUploadAttentionItem = {
  outfitId: string;
  title: string | null;
  occasion: string | null;
  status: string;
  consentAi: string;
  createdAt: string;
  signedUrl: string | null;
  latestJobId: string | null;
  latestJobStatus: string | null;
  error: string | null;
  errorTitle: string | null;
  retryable: boolean;
  state: "failed" | "in_progress" | "draft";
};

/**
 * Draft outfits that still need analysis attention: failed, in progress, or never started.
 */
export async function listOutfitUploadsNeedingAttention(
  viewerId: string,
  limit = 20,
): Promise<OutfitUploadAttentionItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data: outfits, error } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .eq("user_id", viewerId)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  if (!outfits?.length) return [];

  const { data: jobs, error: jobsError } = await supabase
    .from("ai_jobs")
    .select(JOB_COLUMNS)
    .eq("user_id", viewerId)
    .eq("job_type", "outfit_analysis")
    .order("created_at", { ascending: false })
    .limit(100);

  if (jobsError) throw new Error(jobsError.message);

  type JobRow = NonNullable<typeof jobs>[number];
  const latestJobByOutfit = new Map<string, JobRow>();

  for (const job of jobs ?? []) {
    const input = job.input_reference as { outfit_id?: string };
    if (!input.outfit_id || latestJobByOutfit.has(input.outfit_id)) continue;
    latestJobByOutfit.set(input.outfit_id, job);
  }

  return Promise.all(
    outfits.map(async (outfit) => {
      const { data: signed } = await supabase.storage
        .from(OUTFIT_IMAGES_BUCKET)
        .createSignedUrl(outfit.image_path, SIGNED_URL_SECONDS);

      const job = latestJobByOutfit.get(outfit.id) ?? null;
      const facing = job?.error
        ? toUserFacingAnalysisErrorDetails(job.error)
        : null;

      let state: OutfitUploadAttentionItem["state"] = "draft";
      if (job?.status === "queued" || job?.status === "running") {
        state = "in_progress";
      } else if (job?.status === "failed") {
        state = "failed";
      }

      return {
        outfitId: outfit.id,
        title: outfit.title,
        occasion: outfit.occasion,
        status: outfit.status,
        consentAi: outfit.consent_ai_processing,
        createdAt: outfit.created_at,
        signedUrl: signed?.signedUrl ?? null,
        latestJobId: job?.id ?? null,
        latestJobStatus: job?.status ?? null,
        error: facing?.message ?? null,
        errorTitle: facing?.title ?? null,
        retryable:
          outfit.consent_ai_processing === "granted" &&
          (state === "failed" || state === "draft"),
        state,
      };
    }),
  );
}

export async function startAnalysisForExistingOutfit(
  viewerId: string,
  outfitId: string,
  feedbackDepth: "casual" | "detailed" | "improvement" = "detailed",
) {
  const supabase = await createServerSupabaseClient();
  const { data: outfit, error } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .eq("id", outfitId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!outfit) throw new Error("Outfit not found.");
  if (!canAccessOutfit(viewerId, outfit.user_id)) {
    throw new Error("You can only analyze your own outfits.");
  }
  if (outfit.status === "archived") {
    throw new Error("This outfit was archived.");
  }
  if (outfit.consent_ai_processing !== "granted") {
    throw new Error("AI processing consent is required before analysis.");
  }

  const { data: activeJob } = await supabase
    .from("ai_jobs")
    .select(JOB_COLUMNS)
    .eq("user_id", viewerId)
    .eq("job_type", "outfit_analysis")
    .in("status", ["queued", "running"])
    .contains("input_reference", { outfit_id: outfitId })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeJob) {
    return { jobId: activeJob.id, outfitId: outfit.id, alreadyRunning: true };
  }

  const { data: latestFailed } = await supabase
    .from("ai_jobs")
    .select(JOB_COLUMNS)
    .eq("user_id", viewerId)
    .eq("job_type", "outfit_analysis")
    .eq("status", "failed")
    .contains("input_reference", { outfit_id: outfitId })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const priorInput = (latestFailed?.input_reference ?? {}) as {
    feedback_depth?: "casual" | "detailed" | "improvement";
    occasion?: string | null;
  };

  const result = await enqueueOutfitAnalysis(viewerId, {
    outfit_id: outfit.id,
    feedback_depth: priorInput.feedback_depth ?? feedbackDepth,
    occasion: priorInput.occasion ?? outfit.occasion,
  });

  return { ...result, alreadyRunning: false };
}

export async function listRecentAnalyses(viewerId: string, limit = 12) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("outfit_analyses")
    .select(
      `${ANALYSIS_COLUMNS}, outfits ( id, title, image_path, occasion, status )`,
    )
    .eq("user_id", viewerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return Promise.all(
    (data ?? []).map(async (row) => {
      const outfit = Array.isArray(row.outfits) ? row.outfits[0] : row.outfits;
      let signedUrl: string | null = null;
      if (outfit?.image_path) {
        const { data: signed } = await supabase.storage
          .from(OUTFIT_IMAGES_BUCKET)
          .createSignedUrl(outfit.image_path, SIGNED_URL_SECONDS);
        signedUrl = signed?.signedUrl ?? null;
      }
      return { ...row, outfits: outfit ?? null, signedUrl };
    }),
  );
}

export async function getAnalysisDetail(viewerId: string, analysisId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: analysis, error } = await supabase
    .from("outfit_analyses")
    .select(ANALYSIS_COLUMNS)
    .eq("id", analysisId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!analysis) return null;
  if (!canAccessAnalysis(viewerId, analysis.user_id)) {
    throw new Error("You can only view your own analyses.");
  }

  const [{ data: outfit }, { data: recommendations }, { data: followUps }, { data: saved }] =
    await Promise.all([
      supabase
        .from("outfits")
        .select(OUTFIT_COLUMNS)
        .eq("id", analysis.outfit_id)
        .maybeSingle(),
      supabase
        .from("outfit_recommendations")
        .select("id, analysis_id, recommendation_type, content, rank, created_at")
        .eq("analysis_id", analysisId)
        .order("rank", { ascending: true }),
      supabase
        .from("outfit_follow_ups")
        .select("id, analysis_id, question, answer, job_id, created_at")
        .eq("analysis_id", analysisId)
        .order("created_at", { ascending: true }),
      supabase
        .from("saved_looks")
        .select("id, outfit_id, notes, created_at")
        .eq("user_id", viewerId)
        .eq("outfit_id", analysis.outfit_id)
        .maybeSingle(),
    ]);

  let signedUrl: string | null = null;
  if (outfit?.image_path) {
    const { data: signed } = await supabase.storage
      .from(OUTFIT_IMAGES_BUCKET)
      .createSignedUrl(outfit.image_path, SIGNED_URL_SECONDS);
    signedUrl = signed?.signedUrl ?? null;
  }

  return {
    analysis,
    outfit,
    recommendations: recommendations ?? [],
    followUps: followUps ?? [],
    savedLook: saved,
    signedUrl,
  };
}

export async function getPendingJobForOutfit(viewerId: string, outfitId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("ai_jobs")
    .select(JOB_COLUMNS)
    .eq("user_id", viewerId)
    .eq("job_type", "outfit_analysis")
    .in("status", ["queued", "running"])
    .contains("input_reference", { outfit_id: outfitId })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function saveLook(viewerId: string, input: SaveLook) {
  const supabase = await createServerSupabaseClient();
  const { data: outfit, error: outfitError } = await supabase
    .from("outfits")
    .select("id, user_id")
    .eq("id", input.outfit_id)
    .maybeSingle();

  if (outfitError) throw new Error(outfitError.message);
  if (!outfit) throw new Error("Outfit not found.");
  if (!canAccessOutfit(viewerId, outfit.user_id)) {
    throw new Error("You can only save your own outfits.");
  }

  const { data, error } = await supabase
    .from("saved_looks")
    .upsert(
      {
        user_id: viewerId,
        outfit_id: input.outfit_id,
        notes: input.notes ?? null,
      },
      { onConflict: "user_id,outfit_id" },
    )
    .select("id, user_id, outfit_id, notes, created_at")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function unsaveLook(viewerId: string, outfitId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: existing, error: fetchError } = await supabase
    .from("saved_looks")
    .select("id, user_id")
    .eq("user_id", viewerId)
    .eq("outfit_id", outfitId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!existing) return true;
  if (!canAccessSavedLook(viewerId, existing.user_id)) {
    throw new Error("You can only unsave your own looks.");
  }

  const { error } = await supabase
    .from("saved_looks")
    .delete()
    .eq("id", existing.id)
    .eq("user_id", viewerId);

  if (error) throw new Error(error.message);
  return true;
}

export async function listSavedLooks(viewerId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("saved_looks")
    .select(
      "id, user_id, outfit_id, notes, created_at, outfits ( id, title, image_path, occasion, status, created_at )",
    )
    .eq("user_id", viewerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return Promise.all(
    (data ?? []).map(async (row) => {
      const outfit = Array.isArray(row.outfits) ? row.outfits[0] : row.outfits;
      let signedUrl: string | null = null;
      if (outfit?.image_path) {
        const { data: signed } = await supabase.storage
          .from(OUTFIT_IMAGES_BUCKET)
          .createSignedUrl(outfit.image_path, SIGNED_URL_SECONDS);
        signedUrl = signed?.signedUrl ?? null;
      }
      return { ...row, outfits: outfit ?? null, signedUrl };
    }),
  );
}

export async function askFollowUp(viewerId: string, input: FollowUp) {
  const supabase = await createServerSupabaseClient();
  const { data: analysis, error } = await supabase
    .from("outfit_analyses")
    .select(ANALYSIS_COLUMNS)
    .eq("id", input.analysis_id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!analysis) throw new Error("Analysis not found.");
  if (!canAccessAnalysis(viewerId, analysis.user_id)) {
    throw new Error("You can only ask follow-ups on your own analyses.");
  }

  const { data: followUp, error: followError } = await supabase
    .from("outfit_follow_ups")
    .insert({
      analysis_id: analysis.id,
      user_id: viewerId,
      question: input.question,
    })
    .select("id, analysis_id, question, answer, job_id, created_at")
    .single();

  if (followError) throw new Error(followError.message);

  const { data: job, error: jobError } = await supabase
    .from("ai_jobs")
    .insert({
      user_id: viewerId,
      job_type: "outfit_follow_up",
      status: "queued",
      input_reference: asJsonObject({
        analysis_id: analysis.id,
        follow_up_id: followUp.id,
        question: input.question,
      }),
    })
    .select(JOB_COLUMNS)
    .single();

  if (jobError) throw new Error(jobError.message);

  await supabase
    .from("outfit_follow_ups")
    .update({ job_id: job.id })
    .eq("id", followUp.id);

  return { jobId: job.id, followUpId: followUp.id };
}

export async function enqueueCompare(viewerId: string, input: CompareInput) {
  const supabase = await createServerSupabaseClient();
  const { data: outfits, error } = await supabase
    .from("outfits")
    .select("id, user_id")
    .in("id", [input.outfit_a_id, input.outfit_b_id]);

  if (error) throw new Error(error.message);
  if ((outfits ?? []).length !== 2) throw new Error("Both outfits are required.");
  for (const outfit of outfits ?? []) {
    if (!canAccessOutfit(viewerId, outfit.user_id)) {
      throw new Error("You can only compare your own outfits.");
    }
  }

  const { data: job, error: jobError } = await supabase
    .from("ai_jobs")
    .insert({
      user_id: viewerId,
      job_type: "outfit_compare",
      status: "queued",
      input_reference: asJsonObject({
        outfit_a_id: input.outfit_a_id,
        outfit_b_id: input.outfit_b_id,
      }),
    })
    .select(JOB_COLUMNS)
    .single();

  if (jobError) throw new Error(jobError.message);
  return { jobId: job.id };
}

export async function getCompareResult(viewerId: string, jobId: string) {
  const status = await getOutfitJobStatus(viewerId, jobId);
  const supabase = await createServerSupabaseClient();
  const { data: job } = await supabase
    .from("ai_jobs")
    .select("result_reference, status, error")
    .eq("id", jobId)
    .maybeSingle();

  return {
    ...status,
    result: (job?.result_reference ?? null) as {
      compare?: {
        summary: string;
        prefer: "a" | "b" | "tie";
        reasons: string[];
      };
      outfit_a_id?: string;
      outfit_b_id?: string;
    } | null,
  };
}

export async function deleteOutfit(viewerId: string, outfitId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: outfit, error } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .eq("id", outfitId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!outfit) throw new Error("Outfit not found.");
  if (!canAccessOutfit(viewerId, outfit.user_id)) {
    throw new Error("You can only delete your own outfits.");
  }

  await supabase.storage.from(OUTFIT_IMAGES_BUCKET).remove([outfit.image_path]);

  const { error: deleteError } = await supabase
    .from("outfits")
    .delete()
    .eq("id", outfitId)
    .eq("user_id", viewerId);

  if (deleteError) throw new Error(deleteError.message);
  return true;
}

export async function findAnalysisIdForJob(jobId: string) {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("ai_jobs")
    .select("result_reference, status")
    .eq("id", jobId)
    .maybeSingle();

  const result = (data?.result_reference ?? {}) as { analysis_id?: string };
  return {
    status: data?.status ?? null,
    analysisId: result.analysis_id ?? null,
  };
}
