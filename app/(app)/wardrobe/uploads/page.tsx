import { connection } from "next/server";

import { WardrobeNeedsAttentionList } from "@/components/wardrobe/needs-attention-list";
import { isVisionConfigured } from "@/lib/ai/vision/factory";
import { requireUser } from "@/lib/auth/session";
import { listItemsNeedingAttention } from "@/lib/wardrobe/service";

export const metadata = { title: "Wardrobe uploads" };
export const instant = false;

export default async function WardrobeUploadsPage() {
  await connection();
  const user = await requireUser();
  const items = await listItemsNeedingAttention(user.id);
  const visionReady = isVisionConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Needs attention</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Draft uploads and failed categorizations you can retry without re-uploading.
        </p>
      </div>
      <WardrobeNeedsAttentionList items={items} visionReady={visionReady} />
    </div>
  );
}
