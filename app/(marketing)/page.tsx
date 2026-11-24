import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { FEATURES, HOW_IT_WORKS } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 editorial-grid opacity-40" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="space-y-7">
            <p className="text-xs tracking-[0.22em] text-accent uppercase">
              AI style & lifestyle companion
            </p>
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Personal Stylist
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
              Look sharper every day with a companion that learns your wardrobe,
              preferences, and goals — then helps you act on them.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className={cn(buttonVariants({ size: "lg" }), "h-12 px-6")}
              >
                Get started
              </Link>
              <Link
                href="/features"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 px-6",
                )}
              >
                Explore features
              </Link>
            </div>
            <dl className="grid max-w-lg grid-cols-3 gap-4 border-t border-border pt-6 text-sm">
              <div>
                <dt className="text-muted-foreground">Analyze</dt>
                <dd className="font-medium">Outfits with clarity</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Organize</dt>
                <dd className="font-medium">Wardrobe that works</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Improve</dt>
                <dd className="font-medium">Habits that stick</dd>
              </div>
            </dl>
          </div>
          <div className="relative">
            <div className="surface-panel relative overflow-hidden rounded-[1.5rem]">
              <Image
                src="/images/hero-editorial.jpg"
                alt="Editorial fashion portrait representing personal style confidence"
                width={1280}
                height={720}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div className="surface-panel absolute -bottom-5 left-4 right-4 rounded-2xl p-4 sm:left-auto sm:right-6 sm:w-72">
              <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                Outfit insight
              </p>
              <p className="mt-1 font-display text-lg">Balanced silhouette</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Strong color harmony. Try a cleaner footwear finish for sharper
                polish.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-mist/60 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-3">
          {[
            {
              title: "Actionable feedback",
              body: "Scores explain styling — not attractiveness — with concrete alternatives.",
            },
            {
              title: "One connected profile",
              body: "Preferences travel across outfits, grooming, shopping, and the assistant.",
            },
            {
              title: "Honest integrations",
              body: "Trends and products stay live when sources are connected — never invented.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-xs tracking-[0.2em] text-accent uppercase">
              How it works
            </p>
            <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
              From first photo to everyday confidence
            </h2>
          </div>
          <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item) => (
              <li
                key={item.step}
                className="rounded-2xl border border-border bg-card p-6 transition-transform duration-300 hover:-translate-y-1"
              >
                <p className="font-display text-3xl text-accent/80">{item.step}</p>
                <h3 className="mt-4 font-display text-xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-6xl space-y-16 px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs tracking-[0.2em] text-accent uppercase">
              Features
            </p>
            <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
              Everything connected through one style companion
            </h2>
          </div>
          {FEATURES.slice(0, 4).map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                "grid items-center gap-8 lg:grid-cols-2",
                index % 2 === 1 && "lg:[&>*:first-child]:order-2",
              )}
            >
              <div className="space-y-4">
                <h3 className="font-display text-3xl tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
                <Link
                  href={feature.href}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Learn more
                </Link>
              </div>
              <div className="surface-panel overflow-hidden rounded-[1.4rem]">
                <Image
                  src={feature.image}
                  alt={`${feature.title} visual`}
                  width={960}
                  height={720}
                  className="h-72 w-full object-cover sm:h-80"
                />
              </div>
            </div>
          ))}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.slice(4).map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-accent/40"
              >
                <h3 className="font-display text-lg group-hover:text-accent">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-stone/70 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs tracking-[0.2em] text-accent uppercase">
              Product preview
            </p>
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
              Designed like a fashion platform. Built like a personal tool.
            </h2>
            <p className="text-muted-foreground">
              Outfit analysis, wardrobe grids, and discovery feeds are crafted as
              real product surfaces — not wireframe placeholders.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-panel overflow-hidden rounded-2xl">
              <Image
                src="/images/preview-outfit-ui.jpg"
                alt="Preview of the outfit analysis interface"
                width={800}
                height={600}
                className="h-56 w-full object-cover"
              />
            </div>
            <div className="surface-panel overflow-hidden rounded-2xl">
              <Image
                src="/images/preview-wardrobe-ui.jpg"
                alt="Preview of the digital wardrobe interface"
                width={800}
                height={600}
                className="h-56 w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-border">
        <Image
          src="/images/lifestyle-mood.jpg"
          alt="Fashion textures and accessories mood board"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/55" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <h2 className="max-w-xl font-display text-3xl text-white sm:text-4xl">
            Style is a practice. Personal Stylist keeps you consistent.
          </h2>
          <p className="mt-4 max-w-lg text-white/75">
            Build confidence through better outfits, clearer grooming choices,
            and habits that compound.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 rounded-[1.75rem] bg-ink px-6 py-12 text-primary-foreground sm:px-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-3">
            <h2 className="font-display text-3xl tracking-tight">
              Create your personal style profile
            </h2>
            <p className="text-white/70">
              Start with an account. Preferences and deeper style DNA follow as
              you explore.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 bg-white px-6 text-ink hover:bg-white/90",
              )}
            >
              Get started
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 border-white/30 bg-transparent px-6 text-white hover:bg-white/10",
              )}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
