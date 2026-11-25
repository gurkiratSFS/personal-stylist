"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";

import {
  createAndAnalyzeOutfit,
  prepareOutfitUpload,
  type OutfitActionState,
} from "@/app/outfits/actions";
import { PhotoViewer } from "@/components/photos/photo-viewer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  OUTFIT_FEEDBACK_DEPTHS,
  OUTFIT_OCCASIONS,
} from "@/lib/outfits/options";
import { MAX_OUTFIT_BYTES } from "@/lib/outfits/schemas";

const initialState: OutfitActionState = { error: null, message: null };

export function OutfitUploader({ visionReady }: { visionReady: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [consentStorage, setConsentStorage] = useState(false);
  const [consentAi, setConsentAi] = useState(false);
  const [feedbackDepth, setFeedbackDepth] = useState("detailed");
  const [occasion, setOccasion] = useState("");
  const [title, setTitle] = useState("");
  const [pendingUpload, setPendingUpload] = useState<{
    image_path: string;
    mime_type: string;
    bytes: number;
    previewUrl: string;
  } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createAndAnalyzeOutfit,
    initialState,
  );
  const [isPreparing, startPrepare] = useTransition();
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    if (state.jobId && !state.error) {
      router.push(`/analyze/pending/${state.jobId}`);
    }
  }, [state.jobId, state.error, router]);

  function onFileChange(file: File | null) {
    setLocalError(null);
    setPendingUpload(null);
    if (!file) return;
    if (!consentStorage) {
      setLocalError("Confirm storage consent before choosing a photo.");
      return;
    }
    if (file.size > MAX_OUTFIT_BYTES) {
      setLocalError("Images must be 8 MB or smaller.");
      return;
    }

    startPrepare(async () => {
      try {
        const target = await prepareOutfitUpload({
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

        setPendingUpload({
          image_path: target.storagePath,
          mime_type: file.type,
          bytes: file.size,
          previewUrl: URL.createObjectURL(file),
        });
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : "Upload failed.");
      }
    });
  }

  function submit() {
    if (!pendingUpload) return;
    if (!consentAi) {
      setLocalError("AI processing consent is required to analyze this outfit.");
      return;
    }
    if (!visionReady) {
      setLocalError("Outfit analysis isn’t available right now. Please try again later.");
      return;
    }

    const formData = new FormData();
    formData.set("image_path", pendingUpload.image_path);
    formData.set("mime_type", pendingUpload.mime_type);
    formData.set("bytes", String(pendingUpload.bytes));
    formData.set("consent_storage", "true");
    formData.set("consent_ai_processing", "true");
    formData.set("feedback_depth", feedbackDepth);
    if (title.trim()) formData.set("title", title.trim());
    if (occasion) formData.set("occasion", occasion);

    setPendingUpload(null);
    startSaving(() => {
      formAction(formData);
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-mist/60 p-4 text-sm text-muted-foreground">
        Outfit photos stay private to your account with signed links. If you consent to analysis,
        your photo is used only for this review and is not used for model training. Scores describe
        styling, never attractiveness or personal worth.
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-border"
          checked={consentStorage}
          onChange={(event) => setConsentStorage(event.target.checked)}
        />
        <span>I consent to storing this outfit photo privately in my account.</span>
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
          I consent to a one-time AI styling analysis of this photo. Images are not used for model
          training.
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="outfit_title">Title (optional)</Label>
          <input
            id="outfit_title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
            placeholder="Saturday coffee look"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="outfit_occasion">Occasion (optional)</Label>
          <select
            id="outfit_occasion"
            value={occasion}
            onChange={(event) => setOccasion(event.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">Unspecified</option>
            {OUTFIT_OCCASIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Feedback depth</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {OUTFIT_FEEDBACK_DEPTHS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFeedbackDepth(option.value)}
              className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                feedbackDepth === option.value
                  ? "border-accent bg-mist"
                  : "border-border hover:border-accent/40"
              }`}
            >
              <p className="text-sm font-medium">{option.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="outfit_file">Outfit image</Label>
        <input
          ref={fileInputRef}
          id="outfit_file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={!consentStorage || isPreparing}
          className="sr-only"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2"
          disabled={!consentStorage || isPreparing}
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
            className="relative block h-56 w-full overflow-hidden rounded-xl"
            onClick={() => setViewerOpen(true)}
          >
            <Image
              src={pendingUpload.previewUrl}
              alt="Outfit upload preview"
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
            disabled={pending || isSaving || !consentAi || !visionReady}
            onClick={submit}
          >
            {pending || isSaving ? "Starting analysis…" : "Analyze outfit"}
          </Button>
        </div>
      ) : null}

      {localError || state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {localError || state.error}
        </p>
      ) : null}
      {state.message && !state.jobId ? (
        <p className="text-sm text-muted-foreground" role="status">
          {state.message}
        </p>
      ) : null}

      {viewerOpen && pendingUpload ? (
        <PhotoViewer
          src={pendingUpload.previewUrl}
          alt="Outfit upload preview"
          open
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
    </div>
  );
}
