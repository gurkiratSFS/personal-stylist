export function CompletenessMeter({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{clamped}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-mist">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function computeStyleCompleteness(input: {
  essentialsComplete: boolean;
  hasColors: boolean;
  hasFit: boolean;
  hasDnaSummary: boolean;
  hasAppearance: boolean;
  hasPhotos: boolean;
}) {
  let score = 0;
  if (input.essentialsComplete) score += 40;
  if (input.hasColors) score += 15;
  if (input.hasFit) score += 10;
  if (input.hasDnaSummary) score += 15;
  if (input.hasAppearance) score += 10;
  if (input.hasPhotos) score += 10;
  return score;
}
