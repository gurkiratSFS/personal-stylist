"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";

import {
  confirmPhotoUpload,
  preparePhotoUpload,
  removePhoto,
  type PhotoActionState,
} from "@/app/photos/actions";
import { PhotoViewer } from "@/components/photos/photo-viewer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MAX_PHOTO_BYTES } from "@/lib/photos/schemas";
import { PHOTO_TYPES } from "@/lib/style-profile/options";
import { cn } from "@/lib/utils";

const initialState: PhotoActionState = { error: null, message: null };

export type PhotoListItem = {
  id: string;
  photo_type: string;
  signedUrl: string | null;
};

export function PhotoUploader({
  compact = false,
  existing = [],
}: {
  compact?: boolean;
  existing?: PhotoListItem[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [consent, setConsent] = useState(false);
  const [photoType, setPhotoType] = useState("face");
  const [pendingUpload, setPendingUpload] = useState<{
    storage_path: string;
    mime_type: string;
    bytes: number;
    previewUrl: string;
  } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ src: string; alt: string } | null>(null);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(confirmPhotoUpload, initialState);
  const [isPreparing, startPrepare] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!state.message) return;
    router.refresh();
  }, [state.message, router]);

  function onFileChange(file: File | null) {
    setLocalError(null);
    setPendingUpload(null);
    if (!file) return;
    if (!consent) {
      setLocalError("Confirm storage consent before choosing a photo.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setLocalError("Images must be 8 MB or smaller.");
      return;
    }

    startPrepare(async () => {
      try {
        const target = await preparePhotoUpload({
          filename: file.name,
          mimeType: file.type,
          byteSize: file.size,
        });

        const upload = await fetch(target.signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!upload.ok) {
          throw new Error("Upload failed. Try another image.");
        }

        setPendingUpload({
          storage_path: target.storagePath,
          mime_type: file.type,
          bytes: file.size,
          previewUrl: URL.createObjectURL(file),
        });
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : "Upload failed.");
      }
    });
  }

  function savePending() {
    if (!pendingUpload) return;
    const formData = new FormData();
    formData.set("storage_path", pendingUpload.storage_path);
    formData.set("mime_type", pendingUpload.mime_type);
    formData.set("bytes", String(pendingUpload.bytes));
    formData.set("photo_type", photoType);
    formData.set("consent_storage", "true");
    setPendingUpload(null);
    startSaving(() => {
      formAction(formData);
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-mist/60 p-4 text-sm text-muted-foreground">
        Photos stay in a private vault, accessible only to your account via signed links.
        You can delete them anytime. We do not use your images for model training. AI features
        that analyze a photo will ask for separate consent later.
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-border"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        <span>
          I consent to storing this photo privately for my style profile and related features.
        </span>
      </label>

      <div className="space-y-2">
        <Label htmlFor="photo_type">Photo type</Label>
        <select
          id="photo_type"
          value={photoType}
          onChange={(event) => setPhotoType(event.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          {PHOTO_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo_file">Image</Label>
        <input
          ref={fileInputRef}
          id="photo_file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={!consent || isPreparing}
          className="sr-only"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2"
          disabled={!consent || isPreparing}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          {isPreparing ? "Uploading…" : "Choose image"}
        </Button>
        <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP up to 8 MB.</p>
      </div>

      {pendingUpload ? (
        <div className="space-y-3 rounded-2xl border border-border p-4">
          <button
            type="button"
            className="relative block h-48 w-full overflow-hidden rounded-xl"
            onClick={() =>
              setViewer({
                src: pendingUpload.previewUrl,
                alt: "Upload preview",
              })
            }
          >
            <Image
              src={pendingUpload.previewUrl}
              alt="Upload preview"
              fill
              unoptimized
              className="object-cover"
            />
            <span className="absolute inset-x-0 bottom-0 bg-ink/55 px-3 py-2 text-left text-xs text-white">
              Click to preview and zoom
            </span>
          </button>
          <Button
            type="button"
            disabled={pending || isSaving}
            onClick={savePending}
          >
            {pending || isSaving ? "Saving…" : "Save to private vault"}
          </Button>
        </div>
      ) : null}

      {localError || state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {localError || state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {state.message}
        </p>
      ) : null}

      {!compact && existing.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {existing.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-2xl border border-border">
              <button
                type="button"
                className="relative block h-48 w-full bg-mist text-left"
                disabled={!photo.signedUrl}
                onClick={() => {
                  if (!photo.signedUrl) return;
                  setViewer({
                    src: photo.signedUrl,
                    alt: `${photo.photo_type.replace("_", " ")} photo`,
                  });
                }}
              >
                {photo.signedUrl ? (
                  <Image
                    src={photo.signedUrl}
                    alt={`${photo.photo_type} photo`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Preview unavailable
                  </div>
                )}
                {photo.signedUrl ? (
                  <span className="absolute inset-x-0 bottom-0 bg-ink/55 px-3 py-2 text-xs text-white">
                    Open viewer
                  </span>
                ) : null}
              </button>
              <div className="flex items-center justify-between gap-2 p-3">
                <p className="text-sm capitalize">{photo.photo_type.replace("_", " ")}</p>
                <div className="flex gap-2">
                  {photo.signedUrl ? (
                    <button
                      type="button"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      onClick={() =>
                        setViewer({
                          src: photo.signedUrl!,
                          alt: `${photo.photo_type.replace("_", " ")} photo`,
                        })
                      }
                    >
                      View
                    </button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deletingId === photo.id}
                    onClick={async () => {
                      setDeletingId(photo.id);
                      const result = await removePhoto(photo.id);
                      setDeletingId(null);
                      if (!result.error) router.refresh();
                      else setLocalError(result.error);
                    }}
                  >
                    {deletingId === photo.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {viewer ? (
        <PhotoViewer
          src={viewer.src}
          alt={viewer.alt}
          open
          onClose={() => setViewer(null)}
        />
      ) : null}
    </div>
  );
}
