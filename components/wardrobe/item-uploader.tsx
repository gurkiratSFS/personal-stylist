"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";

import {
  createWardrobeItemAction,
  prepareWardrobeUpload,
  type WardrobeActionState,
} from "@/app/wardrobe/actions";
import { PhotoViewer } from "@/components/photos/photo-viewer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MAX_BATCH_UPLOAD, WARDROBE_CATEGORIES } from "@/lib/wardrobe/options";
import { MAX_WARDROBE_BYTES } from "@/lib/wardrobe/schemas";

type PieceDraft = {
  key: string;
  name: string;
  category: string;
  color: string;
  brand: string;
  upload: {
    image_path: string;
    mime_type: string;
    bytes: number;
    previewUrl: string;
  } | null;
  preparing: boolean;
};

function emptyPiece(): PieceDraft {
  return {
    key: `piece-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    category: "",
    color: "",
    brand: "",
    upload: null,
    preparing: false,
  };
}

export function WardrobeItemUploader({
  visionReady,
  onComplete,
}: {
  visionReady: boolean;
  onComplete?: () => void;
}) {
  const router = useRouter();
  const [consentStorage, setConsentStorage] = useState(false);
  const [consentAi, setConsentAi] = useState(false);
  const [pieces, setPieces] = useState<PieceDraft[]>([emptyPiece()]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function updatePiece(key: string, patch: Partial<PieceDraft>) {
    setPieces((prev) =>
      prev.map((piece) => (piece.key === key ? { ...piece, ...patch } : piece)),
    );
  }

  function addPiece() {
    setLocalError(null);
    if (pieces.length >= MAX_BATCH_UPLOAD) {
      setLocalError(`You can add up to ${MAX_BATCH_UPLOAD} pieces at once.`);
      return;
    }
    setPieces((prev) => [...prev, emptyPiece()]);
  }

  function removePiece(key: string) {
    setPieces((prev) => {
      if (prev.length <= 1) return prev;
      const target = prev.find((piece) => piece.key === key);
      if (target?.upload) URL.revokeObjectURL(target.upload.previewUrl);
      return prev.filter((piece) => piece.key !== key);
    });
  }

  async function onFileChange(key: string, file: File | null) {
    setLocalError(null);
    if (!file) return;
    if (!consentStorage) {
      setLocalError("Confirm storage consent before choosing a photo.");
      return;
    }
    if (file.size > MAX_WARDROBE_BYTES) {
      setLocalError("Images must be 8 MB or smaller.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setLocalError("Use a JPEG, PNG, or WebP image.");
      return;
    }

    updatePiece(key, { preparing: true, upload: null });
    try {
      const target = await prepareWardrobeUpload({
        filename: file.name,
        mimeType: file.type,
        byteSize: file.size,
      });

      const upload = await fetch(target.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!upload.ok) {
        throw new Error("Upload failed. Try another image.");
      }

      updatePiece(key, {
        preparing: false,
        upload: {
          image_path: target.storagePath,
          mime_type: file.type,
          bytes: file.size,
          previewUrl: URL.createObjectURL(file),
        },
      });
    } catch (error) {
      updatePiece(key, { preparing: false, upload: null });
      setLocalError(error instanceof Error ? error.message : "Upload failed.");
    }
  }

  function submit(runCategorize: boolean) {
    setLocalError(null);

    if (runCategorize && !consentAi) {
      setLocalError("AI consent is required to auto-categorize.");
      return;
    }

    for (let index = 0; index < pieces.length; index += 1) {
      const piece = pieces[index];
      if (!piece.upload) {
        setLocalError(`Choose an image for piece ${index + 1}.`);
        return;
      }
      if (!runCategorize && !piece.category) {
        setLocalError(
          `Choose a category for piece ${index + 1}, or enable AI categorization.`,
        );
        return;
      }
    }

    startSaving(async () => {
      let firstJobId: string | null = null;
      let savedCount = 0;
      const batch = [...pieces];

      try {
        for (let index = 0; index < batch.length; index += 1) {
          const piece = batch[index];
          if (!piece.upload) continue;
          setProgress(`Saving ${index + 1} of ${batch.length}…`);

          const formData = new FormData();
          formData.set("image_path", piece.upload.image_path);
          formData.set("mime_type", piece.upload.mime_type);
          formData.set("bytes", String(piece.upload.bytes));
          formData.set("consent_storage", "true");
          formData.set("consent_ai_processing", consentAi ? "true" : "false");
          if (runCategorize) formData.set("run_categorize", "true");
          if (piece.name.trim()) formData.set("name", piece.name.trim());
          if (piece.category) formData.set("category", piece.category);
          if (piece.color.trim()) formData.set("color", piece.color.trim());
          if (piece.brand.trim()) formData.set("brand", piece.brand.trim());

          const result: WardrobeActionState = await createWardrobeItemAction(
            { error: null, message: null },
            formData,
          );
          if (result.error) throw new Error(result.error);

          savedCount += 1;
          if (!firstJobId && result.jobId) firstJobId = result.jobId;
        }

        for (const piece of batch) {
          if (piece.upload) URL.revokeObjectURL(piece.upload.previewUrl);
        }
        setProgress(null);
        onComplete?.();

        if (firstJobId && batch.length === 1) {
          router.push(`/wardrobe/pending/${firstJobId}`);
        } else {
          router.push("/wardrobe");
          router.refresh();
        }
      } catch (error) {
        setProgress(null);
        setLocalError(
          error instanceof Error
            ? `${error.message}${savedCount ? ` (${savedCount} saved before this error.)` : ""}`
            : "Could not save pieces.",
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-mist/60 p-4 text-sm text-muted-foreground">
        Clothing photos stay private with signed links. With AI consent, we categorize each
        piece for your wardrobe only — images are not used for model training.
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-border"
          checked={consentStorage}
          onChange={(event) => setConsentStorage(event.target.checked)}
        />
        <span>I consent to storing these clothing photos privately in my account.</span>
      </label>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-border"
          checked={consentAi}
          onChange={(event) => setConsentAi(event.target.checked)}
          disabled={!visionReady}
        />
        <span>
          I consent to AI categorization of these photos. Images are not used for model
          training.
        </span>
      </label>

      <div className="space-y-6">
        {pieces.map((piece, index) => (
          <section
            key={piece.key}
            className="space-y-4 rounded-[1.25rem] border border-border p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Piece {index + 1}</p>
              {pieces.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  disabled={isSaving}
                  onClick={() => removePiece(piece.key)}
                >
                  <Trash2 className="size-3.5" />
                  Remove
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`name-${piece.key}`}>Name (optional)</Label>
                <input
                  id={`name-${piece.key}`}
                  value={piece.name}
                  onChange={(event) =>
                    updatePiece(piece.key, { name: event.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                  placeholder="Navy oxford shirt"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`category-${piece.key}`}>Category</Label>
                <select
                  id={`category-${piece.key}`}
                  value={piece.category}
                  onChange={(event) =>
                    updatePiece(piece.key, { category: event.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  disabled={isSaving}
                >
                  <option value="">
                    {visionReady ? "Let AI suggest" : "Choose a category"}
                  </option>
                  {WARDROBE_CATEGORIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`color-${piece.key}`}>Color (optional)</Label>
                <input
                  id={`color-${piece.key}`}
                  value={piece.color}
                  onChange={(event) =>
                    updatePiece(piece.key, { color: event.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                  placeholder="Navy"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`brand-${piece.key}`}>Brand (optional)</Label>
                <input
                  id={`brand-${piece.key}`}
                  value={piece.brand}
                  onChange={(event) =>
                    updatePiece(piece.key, { brand: event.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`file-${piece.key}`}>Clothing image</Label>
              <input
                id={`file-${piece.key}`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={!consentStorage || isSaving || piece.preparing}
                className="sr-only"
                onChange={(event) =>
                  void onFileChange(piece.key, event.target.files?.[0] ?? null)
                }
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2"
                disabled={!consentStorage || isSaving || piece.preparing}
                onClick={() =>
                  document.getElementById(`file-${piece.key}`)?.click()
                }
              >
                <ImagePlus className="size-4" />
                {piece.preparing
                  ? "Uploading…"
                  : piece.upload
                    ? "Replace image"
                    : "Choose image"}
              </Button>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, or WebP up to 8 MB.
              </p>
            </div>

            {piece.upload ? (
              <button
                type="button"
                className="relative block h-40 w-full overflow-hidden rounded-xl border border-border"
                onClick={() => setViewerUrl(piece.upload?.previewUrl ?? null)}
              >
                <Image
                  src={piece.upload.previewUrl}
                  alt={piece.name || `Piece ${index + 1} preview`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </button>
            ) : null}
          </section>
        ))}
      </div>

      {pieces.length < MAX_BATCH_UPLOAD ? (
        <button
          type="button"
          onClick={addPiece}
          disabled={isSaving}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
        >
          <Plus className="size-4" />
          Add Another Piece
        </button>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Maximum of {MAX_BATCH_UPLOAD} pieces per save.
        </p>
      )}

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        {visionReady && consentAi ? (
          <Button
            type="button"
            disabled={isSaving}
            onClick={() => submit(true)}
          >
            {isSaving
              ? progress || "Saving…"
              : pieces.length > 1
                ? `Save & categorize ${pieces.length}`
                : "Save & categorize"}
          </Button>
        ) : null}
        <Button
          type="button"
          variant={visionReady && consentAi ? "outline" : "default"}
          disabled={isSaving}
          onClick={() => submit(false)}
        >
          {isSaving
            ? progress || "Saving…"
            : pieces.length > 1
              ? `Save ${pieces.length} manually`
              : "Save with manual details"}
        </Button>
      </div>

      {localError ? (
        <p className="text-sm text-destructive" role="alert">
          {localError}
        </p>
      ) : null}

      {viewerUrl ? (
        <PhotoViewer
          src={viewerUrl}
          alt="Wardrobe upload preview"
          open
          onClose={() => setViewerUrl(null)}
        />
      ) : null}
    </div>
  );
}
