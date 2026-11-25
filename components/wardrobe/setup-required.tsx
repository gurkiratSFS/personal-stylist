import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WardrobeSetupRequired() {
  return (
    <section className="rounded-[1.5rem] border border-border bg-mist/70 px-6 py-6 sm:px-8">
      <p className="text-xs tracking-[0.18em] text-accent uppercase">
        AI features paused
      </p>
      <h2 className="mt-2 font-display text-2xl tracking-tight">
        Auto-categorize and outfit generation aren’t available right now
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        You can still upload pieces, set categories yourself, and build combinations
        manually. AI features will return once the styling service is connected.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/profile#style-dna" className={cn(buttonVariants({ variant: "outline" }))}>
          Review Style DNA
        </Link>
      </div>
    </section>
  );
}
