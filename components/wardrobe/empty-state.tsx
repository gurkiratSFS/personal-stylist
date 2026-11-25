import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WardrobeEmptyState({
  title,
  body,
  ctaHref = "/wardrobe?new=1",
  ctaLabel = "Add a piece",
}: {
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <section className="rounded-[1.5rem] border border-dashed border-border bg-mist/40 px-6 py-12 text-center">
      <h2 className="font-display text-2xl tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      <Link href={ctaHref} className={cn(buttonVariants(), "mt-6 inline-flex")}>
        {ctaLabel}
      </Link>
    </section>
  );
}
