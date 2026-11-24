import Image from "next/image";
import Link from "next/link";

import { PageHero } from "@/components/marketing/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { FEATURES } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

export const metadata = { title: "Features" };

export default function FeaturesPage() {
  return (
    <div>
      <PageHero
        eyebrow="Features"
        title="A connected system for style, grooming, and everyday decisions"
        description="Each module stands alone, but they share one profile so recommendations stay coherent."
      />
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-16 sm:px-6">
        {FEATURES.map((feature, index) => (
          <section
            key={feature.title}
            id={feature.href.split("#")[1]}
            className={cn(
              "grid items-center gap-8 lg:grid-cols-2",
              index % 2 === 1 && "lg:[&>*:first-child]:order-2",
            )}
          >
            <div className="space-y-4">
              <h2 className="font-display text-3xl tracking-tight">
                {feature.title}
              </h2>
              <p className="text-muted-foreground">{feature.description}</p>
              <Link href="/signup" className={cn(buttonVariants())}>
                Start with an account
              </Link>
            </div>
            <div className="surface-panel overflow-hidden rounded-[1.4rem]">
              <Image
                src={feature.image}
                alt={`${feature.title} preview`}
                width={960}
                height={720}
                className="h-72 w-full object-cover"
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
