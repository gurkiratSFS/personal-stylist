import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";

import { OutfitEmptyState } from "@/components/outfits/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listRecentAnalyses } from "@/lib/outfits/service";

export const metadata = { title: "Analysis history" };
export const instant = false;

export default async function AnalyzeHistoryPage() {
  await connection();
  const user = await requireUser();
  const analyses = await listRecentAnalyses(user.id, 40);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs tracking-[0.18em] text-accent uppercase">History</p>
        <h1 className="font-display text-4xl tracking-tight">Past outfit reports</h1>
      </div>

      {analyses.length === 0 ? (
        <OutfitEmptyState
          title="No history yet"
          body="Your validated reports will collect here after the first analysis."
          ctaHref="/analyze?new=1"
          ctaLabel="Analyze an outfit"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {analyses.map((item) => (
            <Link
              key={item.id}
              href={`/analyze/${item.id}`}
              className="overflow-hidden rounded-[1.3rem] border border-border bg-card transition-colors hover:border-accent/40"
            >
              <div className="relative h-48 bg-mist">
                {item.signedUrl ? (
                  <Image
                    src={item.signedUrl}
                    alt={item.outfits?.title || "Outfit report"}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="space-y-1 p-4">
                <h2 className="font-display text-xl tracking-tight">
                  {item.outfits?.title || "Outfit report"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {Number(item.overall_score).toFixed(1)}/10 · {item.confidence}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
