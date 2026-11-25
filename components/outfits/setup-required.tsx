import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SetupRequired() {
  return (
    <section className="rounded-[1.5rem] border border-border bg-mist/70 px-6 py-8 sm:px-8">
      <p className="text-xs tracking-[0.18em] text-accent uppercase">
        Temporarily unavailable
      </p>
      <h2 className="mt-3 font-display text-3xl tracking-tight">
        Outfit analysis isn’t available right now
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        We’re finishing a few things behind the scenes. You can still refine your Style DNA and
        come back to analyze a look shortly.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/profile#style-dna" className={cn(buttonVariants({ variant: "outline" }))}>
          Review Style DNA
        </Link>
        <Link href="/home" className={cn(buttonVariants())}>
          Back to home
        </Link>
      </div>
    </section>
  );
}
