import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { labelFor, OUTFIT_OCCASIONS } from "@/lib/outfits/options";
import { cn } from "@/lib/utils";

export function SavedLookCard({
  title,
  occasion,
  signedUrl,
  href,
  notes,
}: {
  title: string;
  occasion: string | null;
  signedUrl: string | null;
  href: string;
  notes?: string | null;
}) {
  return (
    <article className="overflow-hidden rounded-[1.3rem] border border-border bg-card">
      <Link href={href} className="relative block h-48 bg-mist">
        {signedUrl ? (
          <Image
            src={signedUrl}
            alt={title}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Preview unavailable
          </div>
        )}
      </Link>
      <div className="space-y-2 p-4">
        <h3 className="font-display text-xl tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {occasion
            ? labelFor(OUTFIT_OCCASIONS, occasion)
            : "Occasion unspecified"}
        </p>
        {notes ? <p className="text-sm text-muted-foreground">{notes}</p> : null}
        <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Open
        </Link>
      </div>
    </article>
  );
}
