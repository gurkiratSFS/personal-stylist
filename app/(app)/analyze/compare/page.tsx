import { connection } from "next/server";

import { CompareView } from "@/components/outfits/compare-view";
import { OutfitEmptyState } from "@/components/outfits/empty-state";
import { SetupRequired } from "@/components/outfits/setup-required";
import { isVisionConfigured } from "@/lib/ai/vision/factory";
import { requireUser } from "@/lib/auth/session";
import { listSavedLooks } from "@/lib/outfits/service";

export const metadata = { title: "Compare outfits" };
export const instant = false;

export default async function ComparePage() {
  await connection();
  const user = await requireUser();
  const visionReady = isVisionConfigured();
  const saved = await listSavedLooks(user.id);

  const options = saved.map((item) => ({
    outfitId: item.outfit_id,
    title: item.outfits?.title || "Saved look",
    signedUrl: item.signedUrl,
  }));

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs tracking-[0.18em] text-accent uppercase">Compare</p>
        <h1 className="font-display text-4xl tracking-tight">Two looks, one decision</h1>
        <p className="text-muted-foreground">
          Compare saved outfits for the same person. Styling only — never attractiveness.
        </p>
      </div>

      {!visionReady ? <SetupRequired /> : null}

      {options.length < 2 ? (
        <OutfitEmptyState
          title="Save two looks first"
          body="You need at least two saved looks to run a comparison."
          ctaHref="/analyze/saved"
          ctaLabel="Open saved looks"
        />
      ) : (
        <div className="rounded-[1.5rem] border border-border bg-card px-5 py-6 sm:px-6">
          <CompareView options={options} visionReady={visionReady} />
        </div>
      )}
    </div>
  );
}
