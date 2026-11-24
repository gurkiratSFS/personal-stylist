import { PageHero } from "@/components/marketing/page-hero";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div>
      <PageHero
        eyebrow="Contact"
        title="Talk with the Personal Stylist team"
        description="Questions about the product, privacy, or partnerships — we read every message."
      />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-8">
          <h2 className="font-display text-2xl">Email</h2>
          <p className="mt-3 text-muted-foreground">
            Reach us at{" "}
            <a
              href="mailto:hello@personalstylist.app"
              className="text-foreground underline-offset-4 hover:underline"
            >
              hello@personalstylist.app
            </a>
            . For privacy requests, include “Privacy” in the subject line.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-mist p-4">
              <p className="text-sm font-medium">Product feedback</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell us what would make outfit feedback more useful.
              </p>
            </div>
            <div className="rounded-xl bg-mist p-4">
              <p className="text-sm font-medium">Press & partnerships</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Retailers and creators — introduce yourself with a short brief.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
