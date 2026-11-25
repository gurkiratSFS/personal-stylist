import Image from "next/image";
import Link from "next/link";

import { labelFor, WARDROBE_CATEGORIES } from "@/lib/wardrobe/options";

export function WardrobeItemCard({
  id,
  name,
  category,
  color,
  status,
  signedUrl,
}: {
  id: string;
  name: string | null;
  category: string | null;
  color: string | null;
  status: string;
  signedUrl: string | null;
}) {
  return (
    <Link
      href={`/wardrobe/${id}`}
      className="group block overflow-hidden rounded-[1.25rem] border border-border bg-card transition-colors hover:border-accent/40"
    >
      <div className="relative aspect-[4/5] bg-mist">
        {signedUrl ? (
          <Image
            src={signedUrl}
            alt={name || "Wardrobe item"}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : null}
      </div>
      <div className="space-y-1 px-4 py-3">
        <p className="truncate text-sm font-medium">
          {name || "Untitled piece"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {[labelFor(WARDROBE_CATEGORIES, category), color]
            .filter(Boolean)
            .join(" · ") || (status === "draft" ? "Needs details" : "Ready")}
        </p>
      </div>
    </Link>
  );
}
