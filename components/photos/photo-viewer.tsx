"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Minus, Plus, RotateCcw, X, Maximize2 } from "lucide-react";

import { Button } from "@/components/ui/button";

function ViewerCanvas({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "+" || event.key === "=") {
        setScale((value) => Math.min(3, value + 0.25));
      }
      if (event.key === "-") {
        setScale((value) => Math.max(0.5, value - 0.25));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink/90 text-white"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <p className="truncate text-sm">{alt}</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
            onClick={() => setScale((value) => Math.max(0.5, value - 0.25))}
            aria-label="Zoom out"
          >
            <Minus className="size-4" />
          </Button>
          <span className="min-w-12 text-center text-xs tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
            onClick={() => setScale((value) => Math.min(3, value + 0.25))}
            aria-label="Zoom in"
          >
            <Plus className="size-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
            onClick={() => setRotation((value) => (value + 90) % 360)}
            aria-label="Rotate"
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
            onClick={() => {
              setScale(1);
              setRotation(0);
            }}
            aria-label="Reset view"
          >
            <Maximize2 className="size-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center overflow-auto p-6">
        <div
          className="relative transition-transform duration-200"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
        >
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={1600}
            unoptimized
            className="max-h-[75vh] w-auto max-w-[90vw] object-contain"
          />
        </div>
      </div>
    </div>
  );
}

export function PhotoViewer({
  src,
  alt,
  open,
  onClose,
}: {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  // Remount resets zoom/rotation without setState-in-effect.
  return <ViewerCanvas key={src} src={src} alt={alt} onClose={onClose} />;
}
