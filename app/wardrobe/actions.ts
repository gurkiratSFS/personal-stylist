"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { isVisionConfigured } from "@/lib/ai/vision/factory";
import {
  toUserFacingWardrobeError,
  toUserFacingWardrobeUnavailableMessage,
} from "@/lib/wardrobe/errors";
import {
  ALLOWED_WARDROBE_MIME_TYPES,
  MAX_WARDROBE_BYTES,
  calendarAssignSchema,
  combinationCreateSchema,
  combinationUpdateSchema,
  generateCombinationsInputSchema,
  wardrobeItemUpdateSchema,
  wardrobeUploadSchema,
} from "@/lib/wardrobe/schemas";
import { triggerWardrobeJob } from "@/lib/wardrobe/runner";
import {
  assignCalendarDate,
  createCombination,
  createWardrobeUploadTarget,
  deleteCombination,
  deleteWardrobeItem,
  enqueueGenerateCombinations,
  enqueueWardrobeCategorize,
  getWardrobeJobStatus,
  registerWardrobeItem,
  removeCalendarEntry,
  retryFailedWardrobeJob,
  updateCombination,
  updateWardrobeItem,
} from "@/lib/wardrobe/service";

export type WardrobeActionState = {
  error: string | null;
  message: string | null;
  itemId?: string | null;
  jobId?: string | null;
  combinationId?: string | null;
};

function revalidateWardrobe() {
  revalidatePath("/wardrobe");
}

export async function prepareWardrobeUpload(input: {
  filename: string;
  mimeType: string;
  byteSize: number;
}) {
  const user = await requireUser();

  if (
    !ALLOWED_WARDROBE_MIME_TYPES.includes(
      input.mimeType as (typeof ALLOWED_WARDROBE_MIME_TYPES)[number],
    )
  ) {
    throw new Error("Use a JPEG, PNG, or WebP image.");
  }
  if (input.byteSize <= 0 || input.byteSize > MAX_WARDROBE_BYTES) {
    throw new Error("Images must be 8 MB or smaller.");
  }

  return createWardrobeUploadTarget(user.id, input.filename, input.mimeType);
}

export async function createWardrobeItemAction(
  _prev: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const user = await requireUser();
  const consentStorage =
    formData.get("consent_storage") === "on" ||
    formData.get("consent_storage") === "true";
  const consentAi =
    formData.get("consent_ai_processing") === "on" ||
    formData.get("consent_ai_processing") === "true"
      ? "granted"
      : "denied";
  const runCategorize =
    formData.get("run_categorize") === "on" ||
    formData.get("run_categorize") === "true";

  const parsed = wardrobeUploadSchema.safeParse({
    image_path: String(formData.get("image_path") ?? ""),
    consent_storage: consentStorage ? true : false,
    consent_ai_processing: consentAi,
    name: String(formData.get("name") ?? "") || undefined,
    category: String(formData.get("category") ?? "") || undefined,
    color: String(formData.get("color") ?? "") || undefined,
    brand: String(formData.get("brand") ?? "") || undefined,
    bytes: Number(formData.get("bytes") || 0) || undefined,
    mime_type: String(formData.get("mime_type") || "") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "Confirm storage consent and finish the upload before saving.",
      message: null,
    };
  }

  try {
    const item = await registerWardrobeItem(user.id, parsed.data);
    let jobId: string | null = null;

    if (runCategorize && parsed.data.consent_ai_processing === "granted") {
      if (!isVisionConfigured()) {
        revalidateWardrobe();
        return {
          error: null,
          message:
            "Item saved. AI categorization isn’t available — set a category manually.",
          itemId: item.id,
        };
      }
      const enqueued = await enqueueWardrobeCategorize(user.id, item.id);
      jobId = enqueued.jobId;
      after(() => {
        void triggerWardrobeJob(jobId!);
      });
    }

    revalidateWardrobe();
    return {
      error: null,
      message: jobId ? "Item saved. Categorizing…" : "Item saved.",
      itemId: item.id,
      jobId,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save item.",
      message: null,
    };
  }
}

export async function updateWardrobeItemAction(
  _prev: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const user = await requireUser();
  const parsed = wardrobeItemUpdateSchema.safeParse({
    item_id: String(formData.get("item_id") ?? ""),
    name: String(formData.get("name") ?? "") || undefined,
    category: String(formData.get("category") ?? "") || undefined,
    color: String(formData.get("color") ?? "") || undefined,
    brand: String(formData.get("brand") ?? "") || undefined,
  });

  if (!parsed.success) {
    return { error: "Check the item details and try again.", message: null };
  }

  try {
    await updateWardrobeItem(user.id, parsed.data);
    revalidateWardrobe();
    return { error: null, message: "Item updated.", itemId: parsed.data.item_id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update item.",
      message: null,
    };
  }
}

export async function deleteWardrobeItemAction(
  _prev: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const user = await requireUser();
  const itemId = String(formData.get("item_id") ?? "");
  if (!itemId) {
    return { error: "Missing item.", message: null };
  }

  try {
    await deleteWardrobeItem(user.id, itemId);
    revalidateWardrobe();
    return { error: null, message: "Item removed." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not remove item.",
      message: null,
    };
  }
}

export async function categorizeWardrobeItemAction(
  _prev: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const user = await requireUser();
  if (!isVisionConfigured()) {
    return {
      error: toUserFacingWardrobeUnavailableMessage(),
      message: null,
    };
  }

  const itemId = String(formData.get("item_id") ?? "");
  if (!itemId) {
    return { error: "Missing item.", message: null };
  }

  try {
    const { jobId } = await enqueueWardrobeCategorize(user.id, itemId);
    after(() => {
      void triggerWardrobeJob(jobId);
    });
    revalidateWardrobe();
    return {
      error: null,
      message: "Categorization started.",
      itemId,
      jobId,
    };
  } catch (error) {
    return {
      error: toUserFacingWardrobeError(
        error instanceof Error ? error.message : null,
      ),
      message: null,
    };
  }
}

export async function generateCombinationsAction(
  _prev: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const user = await requireUser();
  if (!isVisionConfigured()) {
    return {
      error: toUserFacingWardrobeUnavailableMessage(),
      message: null,
    };
  }

  const parsed = generateCombinationsInputSchema.safeParse({
    occasion: String(formData.get("occasion") ?? "") || undefined,
    count: Number(formData.get("count") || 5) || 5,
  });

  if (!parsed.success) {
    return { error: "Choose a valid occasion and count.", message: null };
  }

  try {
    const { jobId } = await enqueueGenerateCombinations(user.id, parsed.data);
    after(() => {
      void triggerWardrobeJob(jobId);
    });
    revalidateWardrobe();
    return {
      error: null,
      message: "Generating outfits…",
      jobId,
    };
  } catch (error) {
    return {
      error: toUserFacingWardrobeError(
        error instanceof Error ? error.message : null,
      ),
      message: null,
    };
  }
}

export async function createCombinationAction(
  _prev: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const user = await requireUser();
  const itemIds = formData
    .getAll("item_ids")
    .map((value) => String(value))
    .filter(Boolean);

  const parsed = combinationCreateSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    occasion: String(formData.get("occasion") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "") || undefined,
    item_ids: itemIds,
    is_favorite: formData.get("is_favorite") === "true",
  });

  if (!parsed.success) {
    return {
      error: "Add a title and at least one owned item.",
      message: null,
    };
  }

  try {
    const combo = await createCombination(user.id, parsed.data);
    revalidateWardrobe();
    return {
      error: null,
      message: "Combination saved.",
      combinationId: combo.id,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not save combination.",
      message: null,
    };
  }
}

export async function toggleFavoriteCombinationAction(
  _prev: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const user = await requireUser();
  const parsed = combinationUpdateSchema.safeParse({
    combination_id: String(formData.get("combination_id") ?? ""),
    is_favorite: formData.get("is_favorite") === "true",
  });

  if (!parsed.success) {
    return { error: "Missing combination.", message: null };
  }

  try {
    await updateCombination(user.id, parsed.data);
    revalidateWardrobe();
    return {
      error: null,
      message: parsed.data.is_favorite ? "Marked favorite." : "Removed favorite.",
      combinationId: parsed.data.combination_id,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not update favorite.",
      message: null,
    };
  }
}

export async function deleteCombinationAction(
  _prev: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const user = await requireUser();
  const combinationId = String(formData.get("combination_id") ?? "");
  if (!combinationId) {
    return { error: "Missing combination.", message: null };
  }

  try {
    await deleteCombination(user.id, combinationId);
    revalidateWardrobe();
    return { error: null, message: "Combination removed." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not remove combination.",
      message: null,
    };
  }
}

export async function assignCalendarAction(
  _prev: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const user = await requireUser();
  const parsed = calendarAssignSchema.safeParse({
    combination_id: String(formData.get("combination_id") ?? ""),
    scheduled_date: String(formData.get("scheduled_date") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined,
  });

  if (!parsed.success) {
    return { error: "Pick a combination and a valid date.", message: null };
  }

  try {
    await assignCalendarDate(user.id, parsed.data);
    revalidateWardrobe();
    return {
      error: null,
      message: "Scheduled.",
      combinationId: parsed.data.combination_id,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not schedule.",
      message: null,
    };
  }
}

export async function removeCalendarAction(
  _prev: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const user = await requireUser();
  const entryId = String(formData.get("entry_id") ?? "");
  if (!entryId) {
    return { error: "Missing calendar entry.", message: null };
  }

  try {
    await removeCalendarEntry(user.id, entryId);
    revalidateWardrobe();
    return { error: null, message: "Removed from calendar." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not remove entry.",
      message: null,
    };
  }
}

export async function pollWardrobeJob(jobId: string) {
  const user = await requireUser();
  return getWardrobeJobStatus(user.id, jobId);
}

export async function retryWardrobeJobAction(failedJobId: string) {
  const user = await requireUser();
  if (!isVisionConfigured()) {
    return {
      error: toUserFacingWardrobeUnavailableMessage(),
      jobId: null as string | null,
    };
  }

  try {
    const result = await retryFailedWardrobeJob(user.id, failedJobId);
    after(() => {
      void triggerWardrobeJob(result.jobId);
    });
    revalidateWardrobe();
    return { error: null as string | null, jobId: result.jobId };
  } catch (error) {
    return {
      error: toUserFacingWardrobeError(
        error instanceof Error ? error.message : null,
      ),
      jobId: null as string | null,
    };
  }
}
