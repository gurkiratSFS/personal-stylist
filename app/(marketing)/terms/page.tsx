import { PageHero } from "@/components/marketing/page-hero";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div>
      <PageHero
        eyebrow="Terms"
        title="Terms of Service"
        description="A plain-language overview of how Personal Stylist is offered. Full legal terms will expand as the product reaches public release."
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-16 text-muted-foreground sm:px-6">
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-foreground">Service</h2>
          <p>
            Personal Stylist provides style, grooming, and lifestyle guidance.
            It does not provide medical diagnosis or professional legal advice.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-foreground">Accounts</h2>
          <p>
            You are responsible for keeping login credentials secure and for
            activity under your account.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-foreground">Acceptable use</h2>
          <p>
            Do not upload content you lack rights to share, attempt to bypass
            security, or misuse the assistant for harmful purposes.
          </p>
        </section>
      </div>
    </div>
  );
}
