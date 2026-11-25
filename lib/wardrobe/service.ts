import { randomUUID } from "crypto";

import { getVisionAnalyzer } from "@/lib/ai/vision/factory";
import type { StyleContextSummary } from "@/lib/ai/vision/provider";
import type { Json } from "@/lib/database.types";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  assertOwnedItemIds,
  canAccessCombination,
  canAccessWardrobeItem,
  canAccessWardrobeJob,
  isOwnedWardrobePath,
} from "@/lib/wardrobe/access";
import { toUserFacingWardrobeErrorDetails } from "@/lib/wardrobe/errors";
import {
  MAX_CATALOG_ITEMS,
  MAX_GENERATE_COUNT,
  MIN_ITEMS_FOR_GENERATE,
  slotForCategory,
  slotsConflict,
} from "@/lib/wardrobe/options";
import {
  calendarAssignSchema,
  combinationCreateSchema,
  combinationUpdateSchema,
  generateCombinationsInputSchema,
  generateCombinationsResultSchema,
  wardrobeCategorizeResultSchema,
  wardrobeItemUpdateSchema,
  wardrobeUploadSchema,
  type CalendarAssign,
  type CombinationCreate,
  type CombinationUpdate,
  type GenerateCombinationsInput,
  type WardrobeItemUpdate,
  type WardrobeUpload,
} from "@/lib/wardrobe/schemas";

type JsonObject = Exclude<Json, string | number | boolean | null | Json[]>;

function asJsonObject(value: Record<string, unknown>): JsonObject {
  return value as JsonObject;
}

export const WARDROBE_IMAGES_BUCKET = "wardrobe-images";
const SIGNED_URL_SECONDS = 60 * 60;
const AI_SIGNED_URL_SECONDS = 5 * 60;

const ITEM_COLUMNS =
  "id, user_id, name, category, color, brand, image_path, status, consent_storage, consent_ai_processing, categorize_job_id, bytes, mime_type, created_at, updated_at";

const COMBINATION_COLUMNS =
  "id, user_id, title, occasion, notes, is_favorite, source, job_id, created_at, updated_at";

const JOB_COLUMNS =
  "id, user_id, job_type, status, input_reference, result_reference, error, started_at, completed_at, created_at, updated_at";

export function buildWardrobeStoragePath(
  userId: string,
  itemId: string,
  filename: string,
) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return `${userId}/${itemId}/${safe || "item.jpg"}`;
}

export async function createWardrobeUploadTarget(
  viewerId: string,
  filename: string,
  mimeType: string,
) {
  const itemId = randomUUID();
  const storagePath = buildWardrobeStoragePath(viewerId, itemId, filename);
  if (!isOwnedWardrobePath(viewerId, storagePath)) {
    throw new Error("Invalid storage path.");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.storage
    .from(WARDROBE_IMAGES_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error) throw new Error(error.message);

  return {
    itemId,
    storagePath,
    mimeType,
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
  };
}

export async function registerWardrobeItem(
  viewerId: string,
  input: WardrobeUpload,
) {
  const values = wardrobeUploadSchema.parse(input);
  if (!isOwnedWardrobePath(viewerId, values.image_path)) {
    throw new Error("Items must be stored under your account folder.");
  }

  const hasManualCategory = Boolean(values.category);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("wardrobe_items")
    .insert({
      user_id: viewerId,
      name: values.name ?? null,
      category: values.category ?? null,
      color: values.color ?? null,
      brand: values.brand ?? null,
      image_path: values.image_path,
      status: hasManualCategory ? "ready" : "draft",
      consent_storage: true,
      consent_ai_processing: values.consent_ai_processing,
      bytes: values.bytes ?? null,
      mime_type: values.mime_type ?? null,
    })
    .select(ITEM_COLUMNS)
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

async function signWardrobeImage(
  imagePath: string,
  seconds = AI_SIGNED_URL_SECONDS,
) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.storage
    .from(WARDROBE_IMAGES_BUCKET)
    .createSignedUrl(imagePath, seconds);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Could not sign wardrobe image.");
  }
  return data.signedUrl;
}

export async function enqueueWardrobeCategorize(
  viewerId: string,
  itemId: string,
) {
  const supabase = await createServerSupabaseClient();
  const { data: item, error } = await supabase
    .from("wardrobe_items")
    .select(ITEM_COLUMNS)
    .eq("id", itemId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!item) throw new Error("Item not found.");
  if (!canAccessWardrobeItem(viewerId, item.user_id)) {
    throw new Error("You can only categorize your own items.");
  }
  if (item.consent_ai_processing !== "granted") {
    throw new Error("AI processing consent is required before categorization.");
  }

  const { data: job, error: jobError } = await supabase
    .from("ai_jobs")
    .insert({
      user_id: viewerId,
      job_type: "wardrobe_categorize",
      status: "queued",
      input_reference: asJsonObject({ item_id: item.id }),
    })
    .select(JOB_COLUMNS)
    .single();

  if (jobError) throw new Error(jobError.message);

  await supabase
    .from("wardrobe_items")
    .update({ categorize_job_id: job.id })
    .eq("id", item.id)
    .eq("user_id", viewerId);

  return { jobId: job.id, itemId: item.id };
}

export async function getWardrobeJobStatus(viewerId: string, jobId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: job, error } = await supabase
    .from("ai_jobs")
    .select(JOB_COLUMNS)
    .eq("id", jobId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!job) throw new Error("Job not found.");
  if (!canAccessWardrobeJob(viewerId, job.user_id)) {
    throw new Error("You can only view your own jobs.");
  }

  const result = (job.result_reference ?? {}) as {
    item_id?: string;
    combination_ids?: string[];
  };

  const facing = job.error
    ? toUserFacingWardrobeErrorDetails(job.error)
    : null;

  return {
    id: job.id,
    status: job.status,
    error: facing?.message ?? null,
    errorTitle: facing?.title ?? null,
    retryable: facing?.retryable ?? false,
    itemId: result.item_id ?? null,
    combinationIds: result.combination_ids ?? [],
    jobType: job.job_type,
  };
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

export async function processWardrobeJob(jobId: string) {
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

  if (job.job_type === "wardrobe_generate_combinations") {
    return processGenerateCombinationsJob(jobId);
  }
  if (job.job_type !== "wardrobe_categorize") {
    await markJobFailed(jobId, "invalid_job_input");
    return { ok: false as const, error: "invalid_job_input" };
  }

  const input = job.input_reference as { item_id?: string };
  if (!input.item_id) {
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

  const { data: item, error: itemError } = await supabase
    .from("wardrobe_items")
    .select(ITEM_COLUMNS)
    .eq("id", input.item_id)
    .maybeSingle();

  if (itemError || !item) {
    await markJobFailed(jobId, "item_not_found");
    return { ok: false as const, error: "item_not_found" };
  }

  if (item.consent_ai_processing !== "granted") {
    await markJobFailed(jobId, "consent_denied");
    return { ok: false as const, error: "consent_denied" };
  }

  const vision = getVisionAnalyzer();
  if (!vision.ok) {
    await markJobFailed(jobId, "missing_key");
    return { ok: false as const, error: "missing_key" };
  }

  try {
    const imageUrl = await signWardrobeImage(item.image_path);
    const styleContext = await loadStyleContext(item.user_id);
    const raw = await vision.analyzer.categorizeItem({
      imageUrl,
      styleContext,
    });

    let report;
    try {
      report = wardrobeCategorizeResultSchema.parse(raw);
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

    await supabase
      .from("wardrobe_item_attributes")
      .delete()
      .eq("item_id", item.id)
      .eq("user_id", item.user_id);

    if (report.attributes.length > 0) {
      const { error: attrError } = await supabase
        .from("wardrobe_item_attributes")
        .insert(
          report.attributes.map((attr) => ({
            item_id: item.id,
            user_id: item.user_id,
            attribute_key: attr.key,
            attribute_value: attr.value,
          })),
        );
      if (attrError) {
        await markJobFailed(jobId, attrError.message);
        return { ok: false as const, error: attrError.message };
      }
    }

    await supabase
      .from("wardrobe_items")
      .update({
        name: item.name?.trim() || report.name,
        category: report.category,
        color: report.color,
        brand: report.brand?.trim() || item.brand,
        status: "ready",
        categorize_job_id: jobId,
      })
      .eq("id", item.id);

    await supabase.from("ai_usage").insert({
      user_id: item.user_id,
      job_id: jobId,
      provider: vision.analyzer.id,
      model: vision.analyzer.model,
      operation: "wardrobe_categorize",
      prompt_tokens: usage?.promptTokenCount ?? null,
      output_tokens: usage?.candidatesTokenCount ?? null,
      usage_metadata: asJsonObject((usage ?? {}) as Record<string, unknown>),
    });

    await supabase
      .from("ai_jobs")
      .update({
        status: "succeeded",
        completed_at: new Date().toISOString(),
        result_reference: asJsonObject({ item_id: item.id }),
        error: null,
      })
      .eq("id", jobId);

    return { ok: true as const, itemId: item.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "categorize_failed";
    await markJobFailed(jobId, message);
    return { ok: false as const, error: message };
  }
}

export async function enqueueGenerateCombinations(
  viewerId: string,
  input: GenerateCombinationsInput,
) {
  const values = generateCombinationsInputSchema.parse(input);
  const supabase = await createServerSupabaseClient();

  const { data: items, error } = await supabase
    .from("wardrobe_items")
    .select("id")
    .eq("user_id", viewerId)
    .eq("status", "ready");

  if (error) throw new Error(error.message);
  if (!items || items.length < MIN_ITEMS_FOR_GENERATE) {
    throw new Error(
      `Add at least ${MIN_ITEMS_FOR_GENERATE} ready wardrobe items before generating outfits.`,
    );
  }

  const { data: job, error: jobError } = await supabase
    .from("ai_jobs")
    .insert({
      user_id: viewerId,
      job_type: "wardrobe_generate_combinations",
      status: "queued",
      input_reference: asJsonObject({
        occasion: values.occasion ?? null,
        count: values.count,
      }),
    })
    .select(JOB_COLUMNS)
    .single();

  if (jobError) throw new Error(jobError.message);
  return { jobId: job.id };
}

async function processGenerateCombinationsJob(jobId: string) {
  const supabase = createServiceSupabaseClient();
  const { data: job, error: jobError } = await supabase
    .from("ai_jobs")
    .select(JOB_COLUMNS)
    .eq("id", jobId)
    .maybeSingle();

  if (jobError || !job) {
    await markJobFailed(jobId, "job_not_found");
    return { ok: false as const, error: "job_not_found" };
  }

  const input = job.input_reference as {
    occasion?: string | null;
    count?: number;
  };
  const count = Math.min(
    Math.max(input.count ?? MAX_GENERATE_COUNT, 1),
    MAX_GENERATE_COUNT,
  );

  await supabase
    .from("ai_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      error: null,
    })
    .eq("id", jobId);

  const { data: items, error: itemsError } = await supabase
    .from("wardrobe_items")
    .select(ITEM_COLUMNS)
    .eq("user_id", job.user_id)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(MAX_CATALOG_ITEMS);

  if (itemsError) {
    await markJobFailed(jobId, itemsError.message);
    return { ok: false as const, error: itemsError.message };
  }

  if (!items || items.length < MIN_ITEMS_FOR_GENERATE) {
    await markJobFailed(jobId, "insufficient_items");
    return { ok: false as const, error: "insufficient_items" };
  }

  const itemIds = items.map((item) => item.id);
  const { data: attrs } = await supabase
    .from("wardrobe_item_attributes")
    .select("item_id, attribute_key, attribute_value")
    .eq("user_id", job.user_id)
    .in("item_id", itemIds);

  const attrsByItem = new Map<string, Array<{ key: string; value: string }>>();
  for (const row of attrs ?? []) {
    const list = attrsByItem.get(row.item_id) ?? [];
    list.push({ key: row.attribute_key, value: row.attribute_value });
    attrsByItem.set(row.item_id, list);
  }

  const catalog = items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    color: item.color,
    brand: item.brand,
    attributes: attrsByItem.get(item.id) ?? [],
  }));
  const allowedIds = new Set(catalog.map((item) => item.id));

  const vision = getVisionAnalyzer();
  if (!vision.ok) {
    await markJobFailed(jobId, "missing_key");
    return { ok: false as const, error: "missing_key" };
  }

  try {
    const styleContext = await loadStyleContext(job.user_id);
    const raw = await vision.analyzer.generateCombinations({
      items: catalog,
      occasion: input.occasion ?? null,
      count,
      styleContext,
    });

    let report;
    try {
      report = generateCombinationsResultSchema.parse(raw);
    } catch {
      await markJobFailed(jobId, "invalid_model_response");
      return { ok: false as const, error: "invalid_model_response" };
    }

    const validCombos = report.combinations.filter((combo) =>
      assertOwnedItemIds(allowedIds, combo.item_ids),
    );

    if (validCombos.length === 0) {
      await markJobFailed(jobId, "foreign_item_ids");
      return { ok: false as const, error: "foreign_item_ids" };
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

    const combinationIds: string[] = [];

    for (const combo of validCombos) {
      const occasion =
        combo.occasion && combo.occasion !== "unknown" ? combo.occasion : null;
      const { data: created, error: createError } = await supabase
        .from("outfit_combinations")
        .insert({
          user_id: job.user_id,
          title: combo.title,
          occasion,
          notes: combo.rationale,
          is_favorite: false,
          source: "ai",
          job_id: jobId,
        })
        .select(COMBINATION_COLUMNS)
        .single();

      if (createError || !created) {
        await markJobFailed(jobId, createError?.message || "generate_failed");
        return {
          ok: false as const,
          error: createError?.message || "generate_failed",
        };
      }

      const { error: linkError } = await supabase
        .from("outfit_combination_items")
        .insert(
          combo.item_ids.map((wardrobe_item_id, index) => ({
            combination_id: created.id,
            wardrobe_item_id,
            user_id: job.user_id,
            sort_order: index,
          })),
        );

      if (linkError) {
        await markJobFailed(jobId, linkError.message);
        return { ok: false as const, error: linkError.message };
      }

      combinationIds.push(created.id);
    }

    await supabase.from("ai_usage").insert({
      user_id: job.user_id,
      job_id: jobId,
      provider: vision.analyzer.id,
      model: vision.analyzer.model,
      operation: "wardrobe_generate_combinations",
      prompt_tokens: usage?.promptTokenCount ?? null,
      output_tokens: usage?.candidatesTokenCount ?? null,
      usage_metadata: asJsonObject((usage ?? {}) as Record<string, unknown>),
    });

    await supabase
      .from("ai_jobs")
      .update({
        status: "succeeded",
        completed_at: new Date().toISOString(),
        result_reference: asJsonObject({ combination_ids: combinationIds }),
        error: null,
      })
      .eq("id", jobId);

    return { ok: true as const, combinationIds };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "generate_failed";
    await markJobFailed(jobId, message);
    return { ok: false as const, error: message };
  }
}

export async function retryFailedWardrobeJob(
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
  if (!canAccessWardrobeJob(viewerId, job.user_id)) {
    throw new Error("You can only retry your own jobs.");
  }
  if (job.status !== "failed") {
    throw new Error("Only failed jobs can be retried.");
  }

  if (job.job_type === "wardrobe_categorize") {
    const input = job.input_reference as { item_id?: string };
    if (!input.item_id) throw new Error("Could not retry this job.");
    return enqueueWardrobeCategorize(viewerId, input.item_id);
  }

  if (job.job_type === "wardrobe_generate_combinations") {
    const input = job.input_reference as {
      occasion?: string | null;
      count?: number;
    };
    return enqueueGenerateCombinations(viewerId, {
      occasion: input.occasion ?? undefined,
      count: input.count ?? 5,
    });
  }

  throw new Error("This job type cannot be retried here.");
}

export async function listWardrobeItems(viewerId: string, category?: string) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("wardrobe_items")
    .select(ITEM_COLUMNS)
    .eq("user_id", viewerId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const items = data ?? [];
  const withUrls = await Promise.all(
    items.map(async (item) => {
      const { data: signed } = await supabase.storage
        .from(WARDROBE_IMAGES_BUCKET)
        .createSignedUrl(item.image_path, SIGNED_URL_SECONDS);
      return { ...item, signedUrl: signed?.signedUrl ?? null };
    }),
  );

  return withUrls;
}

export async function listItemsNeedingAttention(viewerId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: items, error } = await supabase
    .from("wardrobe_items")
    .select(ITEM_COLUMNS)
    .eq("user_id", viewerId)
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = items ?? [];
  const jobIds = rows
    .map((row) => row.categorize_job_id)
    .filter((id): id is string => Boolean(id));

  const jobsById = new Map<
    string,
    { status: string; error: string | null }
  >();

  if (jobIds.length > 0) {
    const { data: jobs } = await supabase
      .from("ai_jobs")
      .select("id, status, error")
      .in("id", jobIds);
    for (const job of jobs ?? []) {
      jobsById.set(job.id, { status: job.status, error: job.error });
    }
  }

  return Promise.all(
    rows.map(async (item) => {
      const { data: signed } = await supabase.storage
        .from(WARDROBE_IMAGES_BUCKET)
        .createSignedUrl(item.image_path, SIGNED_URL_SECONDS);
      const job = item.categorize_job_id
        ? jobsById.get(item.categorize_job_id)
        : null;
      const facing = job?.error
        ? toUserFacingWardrobeErrorDetails(job.error)
        : null;
      return {
        ...item,
        signedUrl: signed?.signedUrl ?? null,
        jobStatus: job?.status ?? null,
        jobError: facing?.message ?? null,
        failedJobId:
          job?.status === "failed" ? item.categorize_job_id : null,
      };
    }),
  );
}

export async function getWardrobeItem(viewerId: string, itemId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: item, error } = await supabase
    .from("wardrobe_items")
    .select(ITEM_COLUMNS)
    .eq("id", itemId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!item) return null;
  if (!canAccessWardrobeItem(viewerId, item.user_id)) {
    throw new Error("You can only view your own items.");
  }

  const { data: attributes } = await supabase
    .from("wardrobe_item_attributes")
    .select("attribute_key, attribute_value")
    .eq("item_id", item.id)
    .eq("user_id", viewerId);

  const { data: signed } = await supabase.storage
    .from(WARDROBE_IMAGES_BUCKET)
    .createSignedUrl(item.image_path, SIGNED_URL_SECONDS);

  return {
    ...item,
    attributes: attributes ?? [],
    signedUrl: signed?.signedUrl ?? null,
  };
}

export async function updateWardrobeItem(
  viewerId: string,
  input: WardrobeItemUpdate,
) {
  const values = wardrobeItemUpdateSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: existing, error: loadError } = await supabase
    .from("wardrobe_items")
    .select(ITEM_COLUMNS)
    .eq("id", values.item_id)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!existing) throw new Error("Item not found.");
  if (!canAccessWardrobeItem(viewerId, existing.user_id)) {
    throw new Error("You can only edit your own items.");
  }

  const nextCategory =
    values.category !== undefined ? values.category : existing.category;
  const status =
    nextCategory || existing.status === "ready" ? "ready" : existing.status;

  const { data, error } = await supabase
    .from("wardrobe_items")
    .update({
      name: values.name !== undefined ? values.name : existing.name,
      category: nextCategory,
      color: values.color !== undefined ? values.color : existing.color,
      brand: values.brand !== undefined ? values.brand : existing.brand,
      status,
    })
    .eq("id", values.item_id)
    .eq("user_id", viewerId)
    .select(ITEM_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteWardrobeItem(viewerId: string, itemId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: item, error } = await supabase
    .from("wardrobe_items")
    .select(ITEM_COLUMNS)
    .eq("id", itemId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!item) throw new Error("Item not found.");
  if (!canAccessWardrobeItem(viewerId, item.user_id)) {
    throw new Error("You can only delete your own items.");
  }

  // Combination links cascade via FK. Remove empty AI/manual combos left with 0 items.
  const { data: links } = await supabase
    .from("outfit_combination_items")
    .select("combination_id")
    .eq("wardrobe_item_id", itemId)
    .eq("user_id", viewerId);

  const comboIds = [...new Set((links ?? []).map((row) => row.combination_id))];

  const { error: deleteError } = await supabase
    .from("wardrobe_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", viewerId);

  if (deleteError) throw new Error(deleteError.message);

  await supabase.storage
    .from(WARDROBE_IMAGES_BUCKET)
    .remove([item.image_path]);

  for (const comboId of comboIds) {
    const { count } = await supabase
      .from("outfit_combination_items")
      .select("id", { count: "exact", head: true })
      .eq("combination_id", comboId)
      .eq("user_id", viewerId);
    if ((count ?? 0) === 0) {
      await supabase
        .from("outfit_combinations")
        .delete()
        .eq("id", comboId)
        .eq("user_id", viewerId);
    }
  }

  return { ok: true as const };
}

export async function createCombination(
  viewerId: string,
  input: CombinationCreate,
) {
  const values = combinationCreateSchema.parse(input);
  const supabase = await createServerSupabaseClient();

  const { data: owned, error: ownedError } = await supabase
    .from("wardrobe_items")
    .select("id, category")
    .eq("user_id", viewerId)
    .in("id", values.item_ids);

  if (ownedError) throw new Error(ownedError.message);
  const ownedIds = new Set((owned ?? []).map((row) => row.id));
  if (!assertOwnedItemIds(ownedIds, values.item_ids)) {
    throw new Error("Combinations can only use your own wardrobe items.");
  }

  const slots = (owned ?? []).map((row) => slotForCategory(row.category));
  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      if (slotsConflict(slots[i], slots[j])) {
        throw new Error(
          "That look mixes pieces that fill the same slot (for example two jeans or two pairs of shoes).",
        );
      }
    }
  }

  const { data: combo, error } = await supabase
    .from("outfit_combinations")
    .insert({
      user_id: viewerId,
      title: values.title,
      occasion: values.occasion ?? null,
      notes: values.notes ?? null,
      is_favorite: values.is_favorite ?? false,
      source: "manual",
    })
    .select(COMBINATION_COLUMNS)
    .single();

  if (error) throw new Error(error.message);

  const { error: linkError } = await supabase
    .from("outfit_combination_items")
    .insert(
      values.item_ids.map((wardrobe_item_id, index) => ({
        combination_id: combo.id,
        wardrobe_item_id,
        user_id: viewerId,
        sort_order: index,
      })),
    );

  if (linkError) {
    await supabase
      .from("outfit_combinations")
      .delete()
      .eq("id", combo.id)
      .eq("user_id", viewerId);
    throw new Error(linkError.message);
  }

  return combo;
}

export async function updateCombination(
  viewerId: string,
  input: CombinationUpdate,
) {
  const values = combinationUpdateSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: existing, error: loadError } = await supabase
    .from("outfit_combinations")
    .select(COMBINATION_COLUMNS)
    .eq("id", values.combination_id)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!existing) throw new Error("Combination not found.");
  if (!canAccessCombination(viewerId, existing.user_id)) {
    throw new Error("You can only edit your own combinations.");
  }

  if (values.item_ids) {
    const { data: owned, error: ownedError } = await supabase
      .from("wardrobe_items")
      .select("id")
      .eq("user_id", viewerId)
      .in("id", values.item_ids);
    if (ownedError) throw new Error(ownedError.message);
    const ownedIds = new Set((owned ?? []).map((row) => row.id));
    if (!assertOwnedItemIds(ownedIds, values.item_ids)) {
      throw new Error("Combinations can only use your own wardrobe items.");
    }

    await supabase
      .from("outfit_combination_items")
      .delete()
      .eq("combination_id", values.combination_id)
      .eq("user_id", viewerId);

    const { error: linkError } = await supabase
      .from("outfit_combination_items")
      .insert(
        values.item_ids.map((wardrobe_item_id, index) => ({
          combination_id: values.combination_id,
          wardrobe_item_id,
          user_id: viewerId,
          sort_order: index,
        })),
      );
    if (linkError) throw new Error(linkError.message);
  }

  const { data, error } = await supabase
    .from("outfit_combinations")
    .update({
      title: values.title ?? existing.title,
      occasion:
        values.occasion !== undefined ? values.occasion : existing.occasion,
      notes: values.notes !== undefined ? values.notes : existing.notes,
      is_favorite:
        values.is_favorite !== undefined
          ? values.is_favorite
          : existing.is_favorite,
    })
    .eq("id", values.combination_id)
    .eq("user_id", viewerId)
    .select(COMBINATION_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCombination(
  viewerId: string,
  combinationId: string,
) {
  const supabase = await createServerSupabaseClient();
  const { data: existing, error } = await supabase
    .from("outfit_combinations")
    .select("id, user_id")
    .eq("id", combinationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!existing) throw new Error("Combination not found.");
  if (!canAccessCombination(viewerId, existing.user_id)) {
    throw new Error("You can only delete your own combinations.");
  }

  const { error: deleteError } = await supabase
    .from("outfit_combinations")
    .delete()
    .eq("id", combinationId)
    .eq("user_id", viewerId);

  if (deleteError) throw new Error(deleteError.message);
  return { ok: true as const };
}

export async function listCombinations(viewerId: string, favoritesOnly = false) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("outfit_combinations")
    .select(COMBINATION_COLUMNS)
    .eq("user_id", viewerId)
    .order("created_at", { ascending: false });

  if (favoritesOnly) {
    query = query.eq("is_favorite", true);
  }

  const { data: combos, error } = await query;
  if (error) throw new Error(error.message);

  const list = combos ?? [];
  if (list.length === 0) return [];

  const comboIds = list.map((c) => c.id);
  const { data: links } = await supabase
    .from("outfit_combination_items")
    .select("combination_id, wardrobe_item_id, sort_order")
    .eq("user_id", viewerId)
    .in("combination_id", comboIds)
    .order("sort_order", { ascending: true });

  const itemIds = [
    ...new Set((links ?? []).map((row) => row.wardrobe_item_id)),
  ];
  const { data: items } =
    itemIds.length > 0
      ? await supabase
          .from("wardrobe_items")
          .select(ITEM_COLUMNS)
          .eq("user_id", viewerId)
          .in("id", itemIds)
      : { data: [] as never[] };

  const itemsById = new Map((items ?? []).map((item) => [item.id, item]));

  const signedByItem = new Map<string, string | null>();
  await Promise.all(
    (items ?? []).map(async (item) => {
      const { data: signed } = await supabase.storage
        .from(WARDROBE_IMAGES_BUCKET)
        .createSignedUrl(item.image_path, SIGNED_URL_SECONDS);
      signedByItem.set(item.id, signed?.signedUrl ?? null);
    }),
  );

  return list.map((combo) => {
    const comboLinks = (links ?? [])
      .filter((link) => link.combination_id === combo.id)
      .map((link) => {
        const item = itemsById.get(link.wardrobe_item_id);
        return item
          ? { ...item, signedUrl: signedByItem.get(item.id) ?? null }
          : null;
      })
      .filter(Boolean);
    return { ...combo, items: comboLinks };
  });
}

export async function assignCalendarDate(
  viewerId: string,
  input: CalendarAssign,
) {
  const values = calendarAssignSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: combo, error } = await supabase
    .from("outfit_combinations")
    .select("id, user_id")
    .eq("id", values.combination_id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!combo) throw new Error("Combination not found.");
  if (!canAccessCombination(viewerId, combo.user_id)) {
    throw new Error("You can only schedule your own combinations.");
  }

  const { data, error: upsertError } = await supabase
    .from("outfit_calendar")
    .upsert(
      {
        user_id: viewerId,
        combination_id: values.combination_id,
        scheduled_date: values.scheduled_date,
        notes: values.notes ?? null,
      },
      { onConflict: "user_id,scheduled_date,combination_id" },
    )
    .select(
      "id, user_id, combination_id, scheduled_date, notes, created_at, updated_at",
    )
    .single();

  if (upsertError) throw new Error(upsertError.message);
  return data;
}

export async function removeCalendarEntry(
  viewerId: string,
  entryId: string,
) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("outfit_calendar")
    .delete()
    .eq("id", entryId)
    .eq("user_id", viewerId);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function listCalendarEntries(
  viewerId: string,
  fromDate: string,
  toDate: string,
) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("outfit_calendar")
    .select(
      "id, user_id, combination_id, scheduled_date, notes, created_at, updated_at",
    )
    .eq("user_id", viewerId)
    .gte("scheduled_date", fromDate)
    .lte("scheduled_date", toDate)
    .order("scheduled_date", { ascending: true });

  if (error) throw new Error(error.message);

  const entries = data ?? [];
  if (entries.length === 0) return [];

  const comboIds = [...new Set(entries.map((e) => e.combination_id))];
  const { data: combos } = await supabase
    .from("outfit_combinations")
    .select(COMBINATION_COLUMNS)
    .eq("user_id", viewerId)
    .in("id", comboIds);

  const comboById = new Map((combos ?? []).map((c) => [c.id, c]));
  return entries.map((entry) => ({
    ...entry,
    combination: comboById.get(entry.combination_id) ?? null,
  }));
}
