import { PageHero } from "@/components/marketing/page-hero";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div>
      <PageHero
        eyebrow="Privacy"
        title="Your photos and preferences stay yours"
        description="Personal Stylist handles appearance data carefully. This page summarizes how we approach privacy as the product grows."
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-16 text-muted-foreground sm:px-6">
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-foreground">What we collect</h2>
          <p>
            Account details, locale preferences, and — when you choose —
            photographs used for styling or grooming guidance. We explain why a
            photo is requested before processing.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-foreground">How we protect it</h2>
          <p>
            Private storage for personal images, signed access, and row-level
            security so users only reach their own records. Secrets stay on the
            server.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-foreground">Your controls</h2>
          <p>
            You can update preferences and request deletion of personal photos.
            We do not use your images to train models without separate explicit
            permission.
          </p>
        </section>
      </div>
    </div>
  );
}
