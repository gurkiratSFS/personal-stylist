import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";

import { WardrobeEmptyState } from "@/components/wardrobe/empty-state";
import { WardrobeItemCard } from "@/components/wardrobe/item-card";
import { WardrobeSetupRequired } from "@/components/wardrobe/setup-required";
import { WardrobeToolbar } from "@/components/wardrobe/wardrobe-toolbar";
import { isVisionConfigured } from "@/lib/ai/vision/factory";
import { requireUser } from "@/lib/auth/session";
import { WARDROBE_CATEGORIES, labelFor } from "@/lib/wardrobe/options";
import { listWardrobeItems } from "@/lib/wardrobe/service";

export const metadata = { title: "My Wardrobe" };
export const instant = false;

export default async function WardrobePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await connection();
  const user = await requireUser();
  const params = await searchParams;
  const category = params.category || undefined;
  const visionReady = isVisionConfigured();
  const items = await listWardrobeItems(user.id, category);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.18em] text-accent uppercase">
            Digital wardrobe
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">
            Clothes you already own
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Upload pieces, keep categories accurate, and dress from your real closet.
          </p>
        </div>
        <Suspense fallback={<div className="h-10 w-32 rounded-lg bg-mist" />}>
          <WardrobeToolbar visionReady={visionReady} />
        </Suspense>
      </div>

      {!visionReady ? <WardrobeSetupRequired /> : null}

      <div className="flex flex-wrap gap-2">
        <CategoryChip href="/wardrobe" active={!category} label="All" />
        {WARDROBE_CATEGORIES.map((option) => (
          <CategoryChip
            key={option.value}
            href={`/wardrobe?category=${option.value}`}
            active={category === option.value}
            label={option.label}
          />
        ))}
      </div>

      {items.length === 0 ? (
        <WardrobeEmptyState
          title={
            category
              ? `No ${labelFor(WARDROBE_CATEGORIES, category)} yet`
              : "Your wardrobe is empty"
          }
          body="Add a photo of something you own to start building outfits from reality."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <WardrobeItemCard
              key={item.id}
              id={item.id}
              name={item.name}
              category={item.category}
              color={item.color}
              status={item.status}
              signedUrl={item.signedUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-accent/40"
      }`}
    >
      {label}
    </Link>
  );
}
