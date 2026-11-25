import { connection } from "next/server";

import { NeedsAttentionList } from "@/components/outfits/needs-attention-list";
import { OutfitEmptyState } from "@/components/outfits/empty-state";
import { isVisionConfigured } from "@/lib/ai/vision/factory";
import { requireUser } from "@/lib/auth/session";
import { listOutfitUploadsNeedingAttention } from "@/lib/outfits/service";

export const metadata = { title: "Outfit uploads" };
export const instant = false;

export default async function AnalyzeUploadsPage() {
  await connection();
  const user = await requireUser();
  const visionReady = isVisionConfigured();
  const uploads = await listOutfitUploadsNeedingAttention(user.id, 40);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs tracking-[0.18em] text-accent uppercase">Uploads</p>
        <h1 className="font-display text-4xl tracking-tight">
          Drafts and retries
        </h1>
        <p className="text-muted-foreground">
          Failed or unfinished analyses stay here with the original photo so you can try again
          later.
        </p>
      </div>

      {uploads.length === 0 ? (
        <OutfitEmptyState
          title="No drafts waiting"
          body="When an analysis fails or you leave mid-way, the upload will show up here."
          ctaHref={visionReady ? "/analyze?new=1" : "/analyze"}
          ctaLabel={visionReady ? "Analyze an outfit" : "Back to analyzer"}
        />
      ) : (
        <NeedsAttentionList
          items={uploads}
          visionReady={visionReady}
          showHeader={false}
        />
      )}
    </div>
  );
}
