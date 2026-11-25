import { connection } from "next/server";

import { OutfitEmptyState } from "@/components/outfits/empty-state";
import { SavedLookCard } from "@/components/outfits/saved-look-card";
import { requireUser } from "@/lib/auth/session";
import { listRecentAnalyses, listSavedLooks } from "@/lib/outfits/service";

export const metadata = { title: "Saved looks" };
export const instant = false;

export default async function SavedLooksPage() {
  await connection();
  const user = await requireUser();
  const [saved, analyses] = await Promise.all([
    listSavedLooks(user.id),
    listRecentAnalyses(user.id, 40),
  ]);

  const analysisByOutfit = new Map(
    analyses.map((item) => [item.outfit_id, item.id]),
  );

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs tracking-[0.18em] text-accent uppercase">Saved</p>
        <h1 className="font-display text-4xl tracking-tight">Looks you kept</h1>
      </div>

      {saved.length === 0 ? (
        <OutfitEmptyState
          title="No saved looks"
          body="Open a report and tap Save look to keep it here."
          ctaHref="/analyze/history"
          ctaLabel="Browse history"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((item) => (
            <SavedLookCard
              key={item.id}
              title={item.outfits?.title || "Saved look"}
              occasion={item.outfits?.occasion ?? null}
              signedUrl={item.signedUrl}
              notes={item.notes}
              href={
                analysisByOutfit.get(item.outfit_id)
                  ? `/analyze/${analysisByOutfit.get(item.outfit_id)}`
                  : "/analyze/history"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
