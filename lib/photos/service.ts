import { randomUUID } from "crypto";

import {
  canAccessUserPhoto,
  isOwnedStoragePath,
} from "@/lib/style-profile/access";
import {
  photoRegisterSchema,
  type PhotoRegister,
} from "@/lib/photos/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const USER_PHOTOS_BUCKET = "user-photos";
const SIGNED_URL_SECONDS = 60 * 60;

const PHOTO_COLUMNS =
  "id, user_id, storage_path, photo_type, consent_storage, consent_ai_processing, consent_recorded_at, bytes, mime_type, width, height, created_at, updated_at";

export function buildPhotoStoragePath(
  userId: string,
  photoId: string,
  filename: string,
) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return `${userId}/${photoId}/${safe || "photo.jpg"}`;
}

export async function createPhotoUploadTarget(
  viewerId: string,
  filename: string,
  mimeType: string,
) {
  const photoId = randomUUID();
  const storagePath = buildPhotoStoragePath(viewerId, photoId, filename);
  if (!isOwnedStoragePath(viewerId, storagePath)) {
    throw new Error("Invalid storage path.");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.storage
    .from(USER_PHOTOS_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error) throw new Error(error.message);

  return {
    photoId,
    storagePath,
    mimeType,
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
  };
}

export async function registerUserPhoto(
  viewerId: string,
  input: PhotoRegister,
) {
  const values = photoRegisterSchema.parse(input);
  if (!isOwnedStoragePath(viewerId, values.storage_path)) {
    throw new Error("Photos must be stored under your account folder.");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_photos")
    .insert({
      user_id: viewerId,
      storage_path: values.storage_path,
      photo_type: values.photo_type,
      consent_storage: true,
      consent_ai_processing: "not_requested",
      bytes: values.bytes ?? null,
      mime_type: values.mime_type ?? null,
      width: values.width ?? null,
      height: values.height ?? null,
    })
    .select(PHOTO_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function listUserPhotosWithUrls(viewerId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_photos")
    .select(PHOTO_COLUMNS)
    .eq("user_id", viewerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const photos = data ?? [];
  return Promise.all(
    photos.map(async (photo) => {
      const { data: signed, error: signError } = await supabase.storage
        .from(USER_PHOTOS_BUCKET)
        .createSignedUrl(photo.storage_path, SIGNED_URL_SECONDS);

      if (signError) {
        return { ...photo, signedUrl: null as string | null };
      }

      return { ...photo, signedUrl: signed.signedUrl as string };
    }),
  );
}

export async function deleteUserPhoto(viewerId: string, photoId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: photo, error: fetchError } = await supabase
    .from("user_photos")
    .select(PHOTO_COLUMNS)
    .eq("id", photoId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!photo) throw new Error("Photo not found.");
  if (!canAccessUserPhoto(viewerId, photo.user_id)) {
    throw new Error("You can only delete your own photos.");
  }

  const { error: storageError } = await supabase.storage
    .from(USER_PHOTOS_BUCKET)
    .remove([photo.storage_path]);

  if (storageError) throw new Error(storageError.message);

  const { error: deleteError } = await supabase
    .from("user_photos")
    .delete()
    .eq("id", photoId)
    .eq("user_id", viewerId);

  if (deleteError) throw new Error(deleteError.message);
  return true;
}
