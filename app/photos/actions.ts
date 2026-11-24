"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import {
  ALLOWED_PHOTO_MIME_TYPES,
  MAX_PHOTO_BYTES,
  photoRegisterSchema,
} from "@/lib/photos/schemas";
import {
  createPhotoUploadTarget,
  deleteUserPhoto,
  registerUserPhoto,
} from "@/lib/photos/service";
import { PHOTO_TYPES, optionValues } from "@/lib/style-profile/options";

export type PhotoActionState = {
  error: string | null;
  message: string | null;
};

export async function preparePhotoUpload(input: {
  filename: string;
  mimeType: string;
  byteSize: number;
}) {
  const user = await requireUser();

  if (!ALLOWED_PHOTO_MIME_TYPES.includes(input.mimeType as (typeof ALLOWED_PHOTO_MIME_TYPES)[number])) {
    throw new Error("Use a JPEG, PNG, or WebP image.");
  }
  if (input.byteSize <= 0 || input.byteSize > MAX_PHOTO_BYTES) {
    throw new Error("Images must be 8 MB or smaller.");
  }

  return createPhotoUploadTarget(user.id, input.filename, input.mimeType);
}

export async function confirmPhotoUpload(
  _prev: PhotoActionState,
  formData: FormData,
): Promise<PhotoActionState> {
  const user = await requireUser();
  const consent = formData.get("consent_storage") === "on" || formData.get("consent_storage") === "true";
  const photoType = String(formData.get("photo_type") ?? "face");
  if (!(optionValues(PHOTO_TYPES) as string[]).includes(photoType)) {
    return { error: "Choose a valid photo type.", message: null };
  }

  const parsed = photoRegisterSchema.safeParse({
    photo_type: photoType,
    storage_path: String(formData.get("storage_path") ?? ""),
    consent_storage: consent ? true : false,
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
    await registerUserPhoto(user.id, parsed.data);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save photo.",
      message: null,
    };
  }

  revalidatePath("/profile");
  revalidatePath("/onboarding");
  return { error: null, message: "Photo saved privately." };
}

export async function removePhoto(photoId: string): Promise<PhotoActionState> {
  const user = await requireUser();
  try {
    await deleteUserPhoto(user.id, photoId);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not delete photo.",
      message: null,
    };
  }

  revalidatePath("/profile");
  revalidatePath("/onboarding");
  return { error: null, message: "Photo deleted." };
}
