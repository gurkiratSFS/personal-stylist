import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";

import { WardrobeItemEditForm } from "@/components/wardrobe/item-edit-form";
import { isVisionConfigured } from "@/lib/ai/vision/factory";
import { requireUser } from "@/lib/auth/session";
import { getWardrobeItem } from "@/lib/wardrobe/service";

export const metadata = { title: "Wardrobe item" };
export const instant = false;

export default async function WardrobeItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  await connection();
  const user = await requireUser();
  const { itemId } = await params;
  const item = await getWardrobeItem(user.id, itemId);
  if (!item) notFound();

  const visionReady = isVisionConfigured();

  return (
    <div className="space-y-8">
      <Link
        href="/wardrobe"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Wardrobe
      </Link>

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-border bg-mist">
          {item.signedUrl ? (
            <Image
              src={item.signedUrl}
              alt={item.name || "Wardrobe item"}
              fill
              unoptimized
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-xs tracking-[0.18em] text-accent uppercase">
              {item.status}
            </p>
            <h1 className="mt-2 font-display text-3xl tracking-tight">
              {item.name || "Untitled piece"}
            </h1>
          </div>
          {item.attributes.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {item.attributes.map((attr) => (
                <li
                  key={`${attr.attribute_key}:${attr.attribute_value}`}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  {attr.attribute_key}: {attr.attribute_value}
                </li>
              ))}
            </ul>
          ) : null}
          <WardrobeItemEditForm item={item} visionReady={visionReady} />
        </div>
      </div>
    </div>
  );
}
