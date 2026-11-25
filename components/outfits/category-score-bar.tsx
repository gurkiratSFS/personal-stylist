import { labelFor, OUTFIT_CATEGORIES } from "@/lib/outfits/options";

export function CategoryScoreBar({
  name,
  score,
  reason,
}: {
  name: string;
  score: number;
  reason: string;
}) {
  const clamped = Math.max(0, Math.min(10, score));
  const width = `${(clamped / 10) * 100}%`;

  return (
    <div className="space-y-2 border-b border-border/70 py-4 last:border-b-0">
      <div className="flex items-end justify-between gap-3">
        <p className="font-medium">
          {labelFor(OUTFIT_CATEGORIES, name) ?? name}
        </p>
        <p className="font-display text-xl tracking-tight">{clamped.toFixed(1)}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-mist">
        <div
          className="h-full rounded-full bg-accent/80 transition-[width] duration-700 ease-out"
          style={{ width }}
        />
      </div>
      <p className="text-sm text-muted-foreground">{reason}</p>
    </div>
  );
}
