"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";

import { OutfitUploader } from "@/components/outfits/outfit-uploader";
import { Button } from "@/components/ui/button";

export function AnalyzeToolbar({ visionReady }: { visionReady: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (searchParams.get("new") === "1" && visionReady) {
      setOpen(true);
    }
  }, [searchParams, visionReady]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function closeModal() {
    setOpen(false);
    if (searchParams.get("new") === "1") {
      router.replace("/analyze");
    }
  }

  function openModal() {
    if (!visionReady) return;
    setOpen(true);
  }

  return (
    <>
      {visionReady ? (
        <Button type="button" onClick={openModal} className="w-full sm:w-auto">
          New analysis
        </Button>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-ink/50"
            aria-label="Close analyze dialog"
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.5rem] border border-border bg-background shadow-xl sm:rounded-[1.5rem]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <p className="text-xs tracking-[0.18em] text-accent uppercase">
                  New analysis
                </p>
                <h2
                  id={titleId}
                  className="mt-1 font-display text-2xl tracking-tight"
                >
                  Analyze an outfit
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 shrink-0 px-0"
                aria-label="Close"
                onClick={closeModal}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="overflow-y-auto px-5 py-5">
              <OutfitUploader visionReady={visionReady} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
