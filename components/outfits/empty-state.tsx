import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OutfitEmptyState({
  title,
  body,
  ctaHref = "/analyze?new=1",
  ctaLabel = "Analyze an outfit",
}: {
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-border bg-card/60 px-6 py-10 text-center">
      <h3 className="font-display text-2xl tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      <Link href={ctaHref} className={cn(buttonVariants(), "mt-5 inline-flex")}>
        {ctaLabel}
      </Link>
    </div>
  );
}
