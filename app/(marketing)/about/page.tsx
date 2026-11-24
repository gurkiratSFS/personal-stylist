import { PageHero } from "@/components/marketing/page-hero";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div>
      <PageHero
        eyebrow="About"
        title="Fashion entry. Personalization forever."
        description="Personal Stylist began as a response to fragmented tools — chatbots that forget you, rating apps that shame, and shopping feeds that ignore your wardrobe."
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-16 text-lg leading-relaxed text-muted-foreground sm:px-6">
        <p>
          We believe style advice should be actionable, respectful, and grounded
          in what you already own. Scores describe coordination — never personal
          worth. Trends come from live sources. Products come from real
          retailers.
        </p>
        <p>
          The long-term vision is a companion that remembers your preferences,
          helps you practice better habits, and meets you whether you prefer a
          visual dashboard or conversation.
        </p>
        <p>
          We ship in finished phases so every screen you open is intentional —
          complete empty states included, not half-built placeholders.
        </p>
      </div>
    </div>
  );
}
