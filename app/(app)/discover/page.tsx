import { ModuleStage } from "@/components/app/module-stage";

export const metadata = { title: "Discover" };

export default function DiscoverPage() {
  return (
    <ModuleStage
      eyebrow="Trend Discovery"
      title="Current fashion — only when the source is live"
      description="Discover will show trends with dates, links, and freshness. Until a permitted feed is connected, this space stays intentionally empty of invented trends."
      nextStep="Explore features on the marketing site, then return once discovery is wired to a live source."
      imageSrc="/images/hero-editorial.jpg"
    />
  );
}
