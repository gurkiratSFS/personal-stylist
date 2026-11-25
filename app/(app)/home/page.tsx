import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";

import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getProfileForUser } from "@/lib/profile/service";
import {
  getStyleProfileForUser,
  isOnboardingEssentialsComplete,
} from "@/lib/style-profile/service";
import { labelFor, BUDGET_BANDS, PREFERRED_STYLES } from "@/lib/style-profile/options";
import { cn } from "@/lib/utils";

export const metadata = { title: "Home" };
export const instant = false;

const journeys = [
  {
    title: "Analyze an outfit",
    body: "Upload a look for structured feedback on color, fit, and accessories.",
    href: "/analyze",
    cta: "Open analyzer",
    image: "/images/preview-outfit-ui.jpg",
  },
  {
    title: "Build your wardrobe",
    body: "Upload pieces, auto-categorize them, and generate outfits from clothes you own.",
    href: "/wardrobe",
    cta: "Open wardrobe",
    image: "/images/preview-wardrobe-ui.jpg",
  },
  {
    title: "Discover trends",
    body: "Explore current fashion once a live discovery source is connected.",
    href: "/discover",
    cta: "Open discover",
    image: "/images/hero-editorial.jpg",
  },
] as const;

export default async function HomePage() {
  await connection();
  const user = await requireUser();
  const [profile, style] = await Promise.all([
    getProfileForUser(user.id),
    getStyleProfileForUser(user.id),
  ]);
  const name =
    profile?.display_name?.trim() || user.email?.split("@")[0] || "there";
  const essentialsComplete = isOnboardingEssentialsComplete(style);
  const stylesPreview = (style?.preferred_styles ?? [])
    .slice(0, 3)
    .map((value) => labelFor(PREFERRED_STYLES, value))
    .join(" · ");

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {!essentialsComplete ? (
        <section className="flex flex-col gap-4 rounded-[1.4rem] border border-accent/30 bg-mist px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="space-y-1">
            <p className="font-display text-xl">Finish your style essentials</p>
            <p className="text-sm text-muted-foreground">
              Categories, styles, budget, and lifestyle unlock a Style DNA that later modules
              can actually use. Photos stay optional.
            </p>
          </div>
          <Link href="/onboarding" className={cn(buttonVariants(), "shrink-0")}>
            Resume onboarding
          </Link>
        </section>
      ) : null}

      <section className="relative min-h-[22rem] overflow-hidden rounded-[1.75rem] border border-border sm:min-h-[26rem]">
        <Image
          src="/images/hero-editorial.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/92 via-ink/75 to-ink/25" />
        <div className="relative flex h-full min-h-[22rem] flex-col justify-end gap-5 px-6 py-10 text-white sm:min-h-[26rem] sm:px-10 sm:py-14">
          <p className="font-display text-sm tracking-[0.2em] text-white/70 uppercase">
            Your style home
          </p>
          <h1 className="max-w-xl font-display text-4xl tracking-tight sm:text-5xl">
            Hello, {name}.
          </h1>
          <p className="max-w-xl text-base text-white/75 sm:text-lg">
            {style?.summary?.trim() ||
              "Outfits, grooming, wardrobe, and habits in one companion. Build your Style DNA to personalize what comes next."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/analyze"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 bg-white px-5 text-ink hover:bg-white/90",
              )}
            >
              Analyze outfit
            </Link>
            <Link
              href="/profile#style-dna"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 border-white/30 bg-transparent px-5 text-white hover:bg-white/10",
              )}
            >
              View Style DNA
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-border bg-card">
          <div className="grid h-full md:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-48 md:min-h-full">
              <Image
                src="/images/lifestyle-mood.jpg"
                alt="Lifestyle style inspiration"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center space-y-4 p-6 sm:p-8">
              <p className="text-xs tracking-[0.18em] text-accent uppercase">
                Style profile
              </p>
              <h2 className="font-display text-3xl tracking-tight">
                {essentialsComplete ? "Essentials locked in" : "Set your style context"}
              </h2>
              <p className="text-muted-foreground">
                {essentialsComplete
                  ? [
                      stylesPreview || null,
                      style?.budget_band
                        ? labelFor(BUDGET_BANDS, style.budget_band)
                        : null,
                      profile?.country && profile?.currency
                        ? `${profile.country} · ${profile.currency}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "Add categories, styles, budget, and lifestyle so recommendations speak your context."}
              </p>
              <Link
                href={essentialsComplete ? "/profile" : "/onboarding"}
                className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
              >
                {essentialsComplete ? "Open profile" : "Start style setup"}
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[1.5rem] bg-mist px-6 py-8 sm:px-8">
          <div className="space-y-3">
            <p className="text-xs tracking-[0.18em] text-accent uppercase">Today</p>
            <h2 className="font-display text-3xl tracking-tight">Daily style challenge</h2>
            <p className="text-muted-foreground">
              Habit challenges arrive in a later phase. Until then, refine one DNA note or add
              an optional photo to your vault.
            </p>
          </div>
          <Link
            href="/profile#style-dna"
            className={cn(buttonVariants({ variant: "outline" }), "mt-6 w-fit")}
          >
            Edit Style DNA
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.18em] text-accent uppercase">Quick access</p>
            <h2 className="mt-2 font-display text-3xl tracking-tight">
              Continue your style journey
            </h2>
          </div>
          <Link
            href="/shopping"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Smart shopping preview
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {journeys.map((item) => (
            <article
              key={item.title}
              className="group overflow-hidden rounded-[1.4rem] border border-border bg-card transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="relative h-44 overflow-hidden">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  aria-hidden
                />
              </div>
              <div className="space-y-3 p-5">
                <h3 className="font-display text-xl">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.body}</p>
                <Link
                  href={item.href}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  {item.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
