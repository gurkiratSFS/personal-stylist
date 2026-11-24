import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ModuleStage({
  title,
  eyebrow,
  description,
  nextStep,
  imageSrc,
}: {
  title: string;
  eyebrow: string;
  description: string;
  nextStep: string;
  imageSrc: string;
}) {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <p className="text-xs tracking-[0.2em] text-accent uppercase">{eyebrow}</p>
        <h1 className="font-display text-4xl tracking-tight">{title}</h1>
        <p className="max-w-xl text-lg text-muted-foreground">{description}</p>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-medium">What you can do now</p>
          <p className="mt-2 text-sm text-muted-foreground">{nextStep}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/profile#style-dna" className={cn(buttonVariants())}>
              Open Style DNA
            </Link>
            <Link
              href="/onboarding"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Style setup
            </Link>
          </div>
        </div>
      </div>
      <div className="surface-panel overflow-hidden rounded-[1.5rem]">
        <Image
          src={imageSrc}
          alt={`${title} preview`}
          width={900}
          height={700}
          className="h-full min-h-72 w-full object-cover"
        />
      </div>
    </div>
  );
}
