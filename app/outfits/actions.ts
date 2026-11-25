"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { isVisionConfigured } from "@/lib/ai/vision/factory";
import {
  toUserFacingAnalysisError,
  toUserFacingUnavailableMessage,
} from "@/lib/outfits/errors";
import {
  ALLOWED_OUTFIT_MIME_TYPES,
  MAX_OUTFIT_BYTES,
  compareSchema,
  followUpSchema,
  outfitUploadSchema,
  saveLookSchema,
  startAnalysisSchema,
} from "@/lib/outfits/schemas";
import { triggerOutfitJob } from "@/lib/outfits/runner";
import {
  askFollowUp,
  createOutfitUploadTarget,
  deleteOutfit,
  enqueueCompare,
  enqueueOutfitAnalysis,
  getCompareResult,
  getOutfitJobStatus,
  registerOutfit,
  retryFailedOutfitAnalysis,
  saveLook,
  startAnalysisForExistingOutfit,
  unsaveLook,
} from "@/lib/outfits/service";

export type OutfitActionState = {
  error: string | null;
  message: string | null;
  outfitId?: string | null;
  jobId?: string | null;
  analysisId?: string | null;
  followUpId?: string | null;
};

export async function prepareOutfitUpload(input: {
  filename: string;
  mimeType: string;
  byteSize: number;
}) {
  const user = await requireUser();

  if (
    !ALLOWED_OUTFIT_MIME_TYPES.includes(
      input.mimeType as (typeof ALLOWED_OUTFIT_MIME_TYPES)[number],
    )
  ) {
    throw new Error("Use a JPEG, PNG, or WebP image.");
  }
  if (input.byteSize <= 0 || input.byteSize > MAX_OUTFIT_BYTES) {
    throw new Error("Images must be 8 MB or smaller.");
  }

  return createOutfitUploadTarget(user.id, input.filename, input.mimeType);
}

export async function confirmOutfitUpload(
  _prev: OutfitActionState,
  formData: FormData,
): Promise<OutfitActionState> {
  const user = await requireUser();
  const consentStorage =
    formData.get("consent_storage") === "on" ||
    formData.get("consent_storage") === "true";
  const consentAi =
    formData.get("consent_ai_processing") === "on" ||
    formData.get("consent_ai_processing") === "true"
      ? "granted"
      : "denied";

  const parsed = outfitUploadSchema.safeParse({
    image_path: String(formData.get("image_path") ?? ""),
    consent_storage: consentStorage ? true : false,
    consent_ai_processing: consentAi,
    title: String(formData.get("title") ?? "") || undefined,
    occasion: String(formData.get("occasion") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "") || undefined,
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
    const outfit = await registerOutfit(user.id, parsed.data);
    revalidatePath("/analyze");
    return {
      error: null,
      message: "Outfit saved.",
      outfitId: outfit.id,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save outfit.",
      message: null,
    };
  }
}

export async function startOutfitAnalysis(
  _prev: OutfitActionState,
  formData: FormData,
): Promise<OutfitActionState> {
  const user = await requireUser();

  if (!isVisionConfigured()) {
    return {
      error: toUserFacingUnavailableMessage(),
      message: null,
    };
  }

  const parsed = startAnalysisSchema.safeParse({
    outfit_id: String(formData.get("outfit_id") ?? ""),
    feedback_depth: String(formData.get("feedback_depth") ?? "detailed"),
    occasion: String(formData.get("occasion") ?? "") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "Choose an outfit and feedback depth to continue.",
      message: null,
    };
  }

  try {
    const { jobId, outfitId } = await enqueueOutfitAnalysis(user.id, parsed.data);
    after(() => {
      void triggerOutfitJob(jobId);
    });

    revalidatePath("/analyze");
    return {
      error: null,
      message: "Analysis started.",
      outfitId,
      jobId,
    };
  } catch (error) {
    return {
      error: toUserFacingAnalysisError(
        error instanceof Error ? error.message : "Could not start analysis.",
      ),
      message: null,
    };
  }
}

export async function createAndAnalyzeOutfit(
  _prev: OutfitActionState,
  formData: FormData,
): Promise<OutfitActionState> {
  const upload = await confirmOutfitUpload(
    { error: null, message: null },
    formData,
  );
  if (upload.error || !upload.outfitId) {
    return upload;
  }

  if (formData.get("consent_ai_processing") !== "true" && formData.get("consent_ai_processing") !== "on") {
    return {
      error: null,
      message: "Outfit saved without AI analysis.",
      outfitId: upload.outfitId,
    };
  }

  const analysisForm = new FormData();
  analysisForm.set("outfit_id", upload.outfitId);
  analysisForm.set(
    "feedback_depth",
    String(formData.get("feedback_depth") ?? "detailed"),
  );
  const occasion = String(formData.get("occasion") ?? "");
  if (occasion) analysisForm.set("occasion", occasion);

  return startOutfitAnalysis({ error: null, message: null }, analysisForm);
}

export async function pollOutfitJob(jobId: string) {
  const user = await requireUser();
  return getOutfitJobStatus(user.id, jobId);
}

export async function retryOutfitAnalysisAction(failedJobId: string) {
  const user = await requireUser();

  if (!isVisionConfigured()) {
    return {
      error: toUserFacingUnavailableMessage(),
      message: null as string | null,
      jobId: null as string | null,
    };
  }

  try {
    const { jobId } = await retryFailedOutfitAnalysis(user.id, failedJobId);
    after(() => {
      void triggerOutfitJob(jobId);
    });
    revalidatePath("/analyze");
    revalidatePath("/analyze/uploads");
    return {
      error: null as string | null,
      message: "Retrying analysis.",
      jobId,
    };
  } catch (error) {
    return {
      error: toUserFacingAnalysisError(
        error instanceof Error ? error.message : "Could not retry analysis.",
      ),
      message: null as string | null,
      jobId: null as string | null,
    };
  }
}

export async function analyzeExistingOutfitAction(outfitId: string) {
  const user = await requireUser();

  if (!isVisionConfigured()) {
    return {
      error: toUserFacingUnavailableMessage(),
      message: null as string | null,
      jobId: null as string | null,
    };
  }

  try {
    const result = await startAnalysisForExistingOutfit(user.id, outfitId);
    if (!result.alreadyRunning) {
      after(() => {
        void triggerOutfitJob(result.jobId);
      });
    }
    revalidatePath("/analyze");
    revalidatePath("/analyze/uploads");
    return {
      error: null as string | null,
      message: result.alreadyRunning
        ? "Analysis already in progress."
        : "Analysis started.",
      jobId: result.jobId,
    };
  } catch (error) {
    return {
      error: toUserFacingAnalysisError(
        error instanceof Error ? error.message : "Could not start analysis.",
      ),
      message: null as string | null,
      jobId: null as string | null,
    };
  }
}

export async function saveLookAction(outfitId: string, notes?: string) {
  const user = await requireUser();
  const parsed = saveLookSchema.safeParse({ outfit_id: outfitId, notes });
  if (!parsed.success) {
    return { error: "Could not save look.", message: null };
  }
  try {
    await saveLook(user.id, parsed.data);
    revalidatePath("/analyze");
    revalidatePath("/analyze/saved");
    return { error: null, message: "Look saved." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save look.",
      message: null,
    };
  }
}

export async function unsaveLookAction(outfitId: string) {
  const user = await requireUser();
  try {
    await unsaveLook(user.id, outfitId);
    revalidatePath("/analyze");
    revalidatePath("/analyze/saved");
    return { error: null, message: "Look removed from saved." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not unsave look.",
      message: null,
    };
  }
}

export async function postFollowUpAction(
  _prev: OutfitActionState,
  formData: FormData,
): Promise<OutfitActionState> {
  const user = await requireUser();
  if (!isVisionConfigured()) {
    return {
      error: toUserFacingUnavailableMessage(),
      message: null,
    };
  }

  const parsed = followUpSchema.safeParse({
    analysis_id: String(formData.get("analysis_id") ?? ""),
    question: String(formData.get("question") ?? ""),
  });

  if (!parsed.success) {
    return { error: "Enter a follow-up question.", message: null };
  }

  try {
    const { jobId, followUpId } = await askFollowUp(user.id, parsed.data);
    after(() => {
      void triggerOutfitJob(jobId);
    });
    revalidatePath(`/analyze/${parsed.data.analysis_id}`);
    return {
      error: null,
      message: "Follow-up queued.",
      jobId,
      followUpId,
      analysisId: parsed.data.analysis_id,
    };
  } catch (error) {
    return {
      error: toUserFacingAnalysisError(
        error instanceof Error ? error.message : "Could not post follow-up.",
      ),
      message: null,
    };
  }
}

export async function startCompareAction(
  _prev: OutfitActionState,
  formData: FormData,
): Promise<OutfitActionState> {
  const user = await requireUser();
  if (!isVisionConfigured()) {
    return {
      error: toUserFacingUnavailableMessage(),
      message: null,
    };
  }

  const parsed = compareSchema.safeParse({
    outfit_a_id: String(formData.get("outfit_a_id") ?? ""),
    outfit_b_id: String(formData.get("outfit_b_id") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: "Choose two different outfits to compare.",
      message: null,
    };
  }

  try {
    const { jobId } = await enqueueCompare(user.id, parsed.data);
    after(() => {
      void triggerOutfitJob(jobId);
    });
    return {
      error: null,
      message: "Comparison started.",
      jobId,
    };
  } catch (error) {
    return {
      error: toUserFacingAnalysisError(
        error instanceof Error ? error.message : "Could not start comparison.",
      ),
      message: null,
    };
  }
}

export async function pollCompareJob(jobId: string) {
  const user = await requireUser();
  return getCompareResult(user.id, jobId);
}

export async function deleteOutfitAction(outfitId: string) {
  const user = await requireUser();
  try {
    await deleteOutfit(user.id, outfitId);
    revalidatePath("/analyze");
    revalidatePath("/analyze/uploads");
    revalidatePath("/analyze/history");
    revalidatePath("/analyze/saved");
    return { error: null, message: "Outfit deleted." };
  } catch (error) {
    return {
      error: toUserFacingAnalysisError(
        error instanceof Error ? error.message : "Could not delete outfit.",
      ),
      message: null,
    };
  }
}
