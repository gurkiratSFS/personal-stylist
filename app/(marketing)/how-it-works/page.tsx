import Link from "next/link";

import { PageHero } from "@/components/marketing/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { HOW_IT_WORKS } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

export const metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <div>
      <PageHero
        eyebrow="How it works"
        title="A clear path from curiosity to a daily style practice"
        description="Personal Stylist is designed as a journey: understand yourself, get feedback, keep what works."
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <ol className="space-y-6">
          {HOW_IT_WORKS.map((item) => (
            <li
              key={item.step}
              className="grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-[auto_1fr] md:items-start"
            >
              <span className="font-display text-4xl text-accent">{item.step}</span>
              <div>
                <h2 className="font-display text-2xl">{item.title}</h2>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-12">
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "h-12 px-6")}>
            Create your profile
          </Link>
        </div>
      </div>
    </div>
  );
}
